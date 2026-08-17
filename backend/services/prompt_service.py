from typing import List, Dict, Any

class PromptService:
    """
    Renders context blocks and details into strict system prompt formats for Gemini.
    """
    def build_prompt(self, question: str, chunks: List[Dict[str, Any]], file_list: List[str] = None, history: List[Dict[str, str]] = None) -> str:
        context_blocks = []
        for idx, chunk in enumerate(chunks, 1):
            meta = chunk.get("metadata", {})
            file_name = meta.get("file_name", meta.get("file_path", "unknown"))
            start_line = meta.get("start_line", 1)
            end_line = meta.get("end_line", 1)
            lang = meta.get("language", "")
            code = chunk.get("code", "")
            class_name = meta.get("class_name", "none")
            method_name = meta.get("method_name", "none")

            block = (
                f"--- Context Snippet [{idx}] ---\n"
                f"File: {file_name}\n"
                f"Lines: {start_line}-{end_line}\n"
                f"Language: {lang}\n"
                f"Scope: Class: {class_name} | Method/Function: {method_name}\n"
                f"```\n{code}\n```"
            )
            context_blocks.append(block)

        formatted_context = "\n\n".join(context_blocks) if context_blocks else "No relevant code snippets retrieved."
        formatted_files = "\n".join([f"- {f}" for f in file_list]) if file_list else "File list unavailable."

        history_str = "No prior conversation history."
        if history:
            recent_history = history[-10:]
            history_lines = []
            for h in recent_history:
                role = "User" if h.get("role") == "user" else "Assistant"
                content = h.get("content", "")
                history_lines.append(f"{role}: {content}")
            history_str = "\n".join(history_lines)

        prompt = (
            "You are CodeMind AI, a Senior Software Engineer. "
            "Your task is to answer the user's query strictly based on the retrieved code context, project file structure, and conversation history provided below.\n\n"
            "=== STRICT INSTRUCTIONS ===\n"
            "1. Answer the question ONLY using the facts, logic, and code present in the RETRIEVED CODE CONTEXT. Do not extrapolate, assume, speculate, or reference outside information. Never hallucinate.\n"
            "2. Always explicitly mention the exact File name, Method/Function, Class/Interface, and Line numbers of the code snippets you reference in your explanation.\n"
            "3. Explain all concepts, designs, and code structures clearly and concisely.\n"
            "4. If the retrieved code context does not contain the information necessary to answer the user's request, respond exactly and only with: \"The information is not available in the indexed repository.\" Do not explain or add any other text.\n\n"
            "=== CONVERSATION HISTORY ===\n"
            f"{history_str}\n"
            "============================\n\n"
            "=== REPOSITORY FILE STRUCTURE ===\n"
            f"{formatted_files}\n"
            "=================================\n\n"
            "=== RETRIEVED CODE CONTEXT ===\n"
            f"{formatted_context}\n"
            "===============================\n\n"
            f"User Request: {question}\n\n"
            "Engineer Explanation & Answer:"
        )
        return prompt
