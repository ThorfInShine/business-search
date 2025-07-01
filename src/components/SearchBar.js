import React, { useState, useEffect, useRef } from 'react';

const SearchBar = ({ searchTerm, onSearch, placeholder }) => {
  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm);
  const [isTyping, setIsTyping] = useState(false);
  const debounceRef = useRef(null);

  // Simple debounce function
  const debounce = (func, wait) => {
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(debounceRef.current);
        func(...args);
      };
      clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(later, wait);
    };
  };

  // Create debounced search function
  const debouncedSearch = useRef(
    debounce((term) => {
      setIsTyping(false);
      onSearch(term);
    }, 800)
  ).current;

  // Handle input change
  const handleInputChange = (e) => {
    const value = e.target.value;
    setLocalSearchTerm(value);
    setIsTyping(true);
    
    // Clear previous debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    // Set new debounce
    debounceRef.current = setTimeout(() => {
      debouncedSearch(value);
    }, 800);
  };

  // Handle immediate search on Enter key
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      // Clear debounce timer
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      setIsTyping(false);
      onSearch(localSearchTerm);
    }
  };

  // Sync with external searchTerm changes
  useEffect(() => {
    if (searchTerm !== localSearchTerm && !isTyping) {
      setLocalSearchTerm(searchTerm);
    }
  }, [searchTerm, localSearchTerm, isTyping]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const handleClear = () => {
    // Clear debounce timer
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    setLocalSearchTerm('');
    setIsTyping(false);
    onSearch('');
  };

  const handleSearchClick = () => {
    // Clear debounce timer
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    setIsTyping(false);
    onSearch(localSearchTerm);
  };

  return (
    <div className="search-container">
      <div className="search-wrapper">
        <button 
          className="search-icon-btn"
          onClick={handleSearchClick}
          title="Cari sekarang"
          aria-label="Cari"
        >
          🔍
        </button>
        <input
          type="text"
          placeholder={placeholder || "Cari usaha..."}
          value={localSearchTerm}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          className="search-input"
          aria-label="Cari usaha"
        />
        {localSearchTerm && (
          <button 
            className="clear-search-btn"
            onClick={handleClear}
            title="Hapus pencarian"
            aria-label="Hapus pencarian"
          >
            ✕
          </button>
        )}
        {isTyping && (
          <div className="typing-indicator" title="Ketik lebih lanjut atau tekan Enter untuk mencari">
            ⏳
          </div>
        )}
      </div>
      {isTyping && (
        <div className="search-hint">
          Tekan Enter untuk mencari langsung atau tunggu 0,8 detik untuk pencarian otomatis
        </div>
      )}
    </div>
  );
};

export default SearchBar;