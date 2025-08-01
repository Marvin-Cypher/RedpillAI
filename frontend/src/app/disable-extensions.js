// Prevent wallet extensions from interfering
if (typeof window !== 'undefined') {
  // Block common wallet injections that cause conflicts
  const blockList = ['solana', 'ethereum', 'phantom', 'metamask'];
  
  blockList.forEach(prop => {
    if (window[prop]) {
      console.log(`Blocking wallet extension: ${prop}`);
      try {
        delete window[prop];
      } catch (e) {
        // Some extensions prevent deletion, try to override
        Object.defineProperty(window, prop, {
          value: undefined,
          writable: false,
          configurable: false
        });
      }
    }
  });
}