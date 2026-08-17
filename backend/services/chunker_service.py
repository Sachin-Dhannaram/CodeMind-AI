import re
import uuid
from typing import List, Dict, Any
from utils.logger import logger

class ChunkerService:
    @staticmethod
    def chunk_file(file_info: Dict[str, Any], repo_name: str) -> List[Dict[str, Any]]:
        """
        Intelligently chunks source code by logical blocks (class, method, interface, function).
        Preserves code structure and prevents splitting methods, storing descriptive metadata.
        Runs in linear O(N) time complexity for production-grade speed.
        """
        content = file_info.get("content", "")
        language = file_info.get("language", "")
        file_path = file_info.get("relative_path", "")
        
        lines = content.splitlines()
        total_lines = len(lines)
        
        if total_lines == 0:
            return []

        # 1. Parse structural blocks (classes, functions, methods, interfaces)
        blocks = []
        try:
            if language == "python":
                blocks = ChunkerService._parse_python_blocks(lines)
            elif language in ["javascript", "typescript", "java", "cpp", "c", "csharp", "go", "rust"]:
                blocks = ChunkerService._parse_brace_blocks(lines)
        except Exception as e:
            logger.warning(f"Error parsing syntax blocks for {file_path}: {e}")
            blocks = []

        # Sort blocks by start line, then by length desc (so classes come before methods starting at same line)
        blocks.sort(key=lambda b: (b["start"], -(b["end"] - b["start"])))

        resolved_blocks = []
        for b in blocks:
            # Check if nested inside a class/interface block
            parent_class = "none"
            for other in blocks:
                if other != b and other["type"] in ["class", "interface", "struct", "public class"]:
                    if other["start"] <= b["start"] and other["end"] >= b["end"]:
                        parent_class = other["name"]
                        break

            class_name = "none"
            method_name = "none"
            if b["type"] in ["class", "interface", "struct", "public class"]:
                class_name = b["name"]
            else:
                class_name = parent_class
                method_name = b["name"]

            resolved_blocks.append({
                "type": b["type"],
                "name": b["name"],
                "start": b["start"],
                "end": b["end"],
                "class_name": class_name,
                "method_name": method_name
            })

        # 2. Track covered lines by method/function blocks to separate global/module-level code
        covered_lines = [False] * total_lines
        for b in resolved_blocks:
            if b["type"] not in ["class", "interface", "struct", "public class"]:
                for l_idx in range(b["start"], min(b["end"] + 1, total_lines)):
                    covered_lines[l_idx] = True

        global_chunks = []
        in_uncovered = False
        start_unc = 0
        for idx in range(total_lines):
            if not covered_lines[idx]:
                if not in_uncovered:
                    in_uncovered = True
                    start_unc = idx
            else:
                if in_uncovered:
                    global_chunks.append((start_unc, idx - 1))
                    in_uncovered = False
        if in_uncovered:
            global_chunks.append((start_unc, total_lines - 1))

        chunks = []
        safe_path_id = re.sub(r'[^a-zA-Z0-9_]', '_', file_path)[:40]

        def create_chunk(start_idx: int, end_idx: int, c_name: str, m_name: str):
            snippet_lines = lines[start_idx:min(end_idx + 1, total_lines)]
            snippet = "\n".join(snippet_lines)
            if not snippet.strip():
                return None
            chunk_id = f"chk_{safe_path_id}_{start_idx + 1}_{end_idx + 1}_{uuid.uuid4().hex[:6]}"
            return {
                "id": chunk_id,
                "code": snippet,
                "metadata": {
                    "repository": str(repo_name),
                    "file_name": str(file_path),
                    "language": str(language),
                    "class_name": str(c_name),
                    "method_name": str(m_name),
                    "start_line": start_idx + 1,
                    "end_line": min(end_idx + 1, total_lines)
                }
            }

        # 3. Add function and method blocks
        for b in resolved_blocks:
            is_class = b["type"] in ["class", "interface", "struct", "public class"]
            class_len = b["end"] - b["start"] + 1
            if is_class and class_len > 100:
                # Big class: chunk only the class header part (until the first nested block)
                first_nested_start = b["end"]
                for other in resolved_blocks:
                    if other != b and other["start"] > b["start"] and other["start"] < first_nested_start:
                        first_nested_start = other["start"]
                if first_nested_start > b["start"]:
                    chunk = create_chunk(b["start"], first_nested_start - 1, b["class_name"], "class_header")
                    if chunk:
                        chunks.append(chunk)
            else:
                chunk = create_chunk(b["start"], b["end"], b["class_name"], b["method_name"])
                if chunk:
                    chunks.append(chunk)

        # 4. Add global / module-level chunks
        for start_idx, end_idx in global_chunks:
            curr_start = start_idx
            while curr_start <= end_idx:
                curr_end = min(curr_start + 60, end_idx)
                chunk = create_chunk(curr_start, curr_end, "none", "none")
                if chunk:
                    chunks.append(chunk)
                curr_start = curr_end + 1

        # 5. Fallback sliding window if no structural chunks could be found
        if not chunks:
            max_lines = 60
            overlap = 15
            start = 0
            while start < total_lines:
                end = min(start + max_lines, total_lines)
                chunk = create_chunk(start, end - 1, "none", "none")
                if chunk:
                    chunks.append(chunk)
                if end == total_lines:
                    break
                start += (max_lines - overlap)

        return chunks

    @staticmethod
    def _parse_python_blocks(lines: List[str]) -> List[Dict[str, Any]]:
        """Parses Python files in linear O(N) time using indentation stack tracking."""
        blocks = []
        n = len(lines)
        stack = []
        
        for idx in range(n):
            line = lines[idx]
            stripped = line.strip()
            if not stripped or stripped.startswith('#'):
                continue
                
            indent = len(line) - len(line.lstrip())
            
            while stack and indent <= stack[-1]["indent"]:
                closed_block = stack.pop()
                blocks.append({
                    "type": closed_block["type"],
                    "name": closed_block["name"],
                    "start": closed_block["start"],
                    "end": idx - 1
                })
                
            match = re.match(r'^(class|def)\s+([A-Za-z0-9_]+)', stripped)
            if match:
                stack.append({
                    "type": match.group(1),
                    "name": match.group(2),
                    "start": idx,
                    "indent": indent
                })
                
        while stack:
            closed_block = stack.pop()
            blocks.append({
                "type": closed_block["type"],
                "name": closed_block["name"],
                "start": closed_block["start"],
                "end": n - 1
            })
            
        return blocks

    @staticmethod
    def _parse_brace_blocks(lines: List[str]) -> List[Dict[str, Any]]:
        """Parses brace languages in linear O(N) time using single-pass depth counting."""
        blocks = []
        n = len(lines)
        stack = []
        
        class_pat = re.compile(r'\b(class|interface|struct|enum)\s+([A-Za-z0-9_]+)')
        func_pat = re.compile(r'\b(function|async\s+function)\s+([A-Za-z0-9_]+)')
        arrow_pat = re.compile(r'\b(const|let|var)\s+([A-Za-z0-9_]+)\s*=\s*(async\s*)?\([^)]*\)\s*=>')
        method_pat = re.compile(r'^\s*(public|private|protected|static|async)?\s*([A-Za-z0-9_]+)\s*\([^)]*\)\s*(\{)?\s*$')
        
        current_depth = 0
        
        for idx in range(n):
            line = lines[idx]
            
            # Skip control flow blocks (do not start a new symbol block)
            if re.search(r'\b(if|for|while|catch|switch|else)\b\s*\(', line) or re.search(r'\b(else|try|finally)\b\s*\{?', line):
                pass
            else:
                match_class = class_pat.search(line)
                match_func = func_pat.search(line)
                match_arrow = arrow_pat.search(line)
                match_method = method_pat.search(line)
                
                matched = None
                symbol_type = "function"
                symbol_name = "unknown"
                
                if match_class:
                    matched = match_class
                    symbol_type = match_class.group(1)
                    symbol_name = match_class.group(2)
                elif match_func:
                    matched = match_func
                    symbol_type = match_func.group(1)
                    symbol_name = match_func.group(2)
                elif match_arrow:
                    matched = match_arrow
                    symbol_type = "function"
                    symbol_name = match_arrow.group(2)
                elif match_method:
                    matched = match_method
                    symbol_type = "method"
                    symbol_name = match_method.group(2)
                    
                if matched:
                    stack.append({
                        "type": symbol_type,
                        "name": symbol_name,
                        "start": idx,
                        "depth": current_depth
                    })
            
            for char in line:
                if char == '{':
                    current_depth += 1
                elif char == '}':
                    current_depth -= 1
                    for s_idx in range(len(stack) - 1, -1, -1):
                        block = stack[s_idx]
                        if block["depth"] == current_depth:
                            blocks.append({
                                "type": block["type"],
                                "name": block["name"],
                                "start": block["start"],
                                "end": idx
                            })
                            stack.pop(s_idx)
                            break
                            
        return blocks
