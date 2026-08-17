import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [repositories, setRepositories] = useState([]);
  const [activeRepo, setActiveRepo] = useState(null);
  const [user, setUser] = useState({ loggedIn: true, name: 'Lead Architect' });
  const [settings, setSettings] = useState({
    gemini_api_key: '',
    top_k: 5,
    chunk_size: 500,
    temperature: 0.2
  });
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchRepositories = async () => {
    try {
      const res = await api.get('/repositories');
      setRepositories(res.data);
      if (res.data.length > 0) {
        if (!activeRepo || !res.data.some(r => r.id === activeRepo.id)) {
          setActiveRepo(res.data[0]);
        }
      } else {
        setActiveRepo(null);
      }
    } catch (err) {
      console.error("Error fetching repositories:", err);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await api.get('/settings');
      setSettings(res.data);
    } catch (err) {
      console.error("Error fetching settings:", err);
    }
  };

  useEffect(() => {
    fetchRepositories();
    fetchSettings();
  }, []);

  return (
    <AppContext.Provider value={{
      repositories,
      setRepositories,
      activeRepo,
      setActiveRepo,
      user,
      setUser,
      settings,
      setSettings,
      chatHistory,
      setChatHistory,
      fetchRepositories,
      fetchSettings,
      loading,
      setLoading
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
