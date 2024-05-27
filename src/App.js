import React, { useState, useEffect } from 'react';
import LoginForm from './components/LoginForm';
import Terminal from './components/Terminal';
import WalletModal from './components/WalletModal';
import animation from './animation';
import './App.css';
import { PromptProvider } from './PromptContext';
import { findPid, register } from './api';
import './globalThisPolyfill';

const splashText = `
            _____                   _______                   _____          
           /\\    \\                 /::\\    \\                 /\\    \\         
          /::\\    \\               /::::\\    \\               /::\\    \\        
         /::::\\    \\             /::::::\\    \\             /::::\\    \\       
        /::::::\\    \\           /::::::::\\    \\           /::::::\\    \\      
       /:::/\\:::\\    \\         /:::/~~\\:::\\    \\         /:::/\\:::\\    \\     
      /:::/__\\:::\\    \\       /:::/    \\:::\\    \\       /:::/__\\:::\\    \\    
     /::::\\   \\:::\\    \\     /:::/    / \\:::\\    \\      \\:::\\   \\:::\\    \\   
    /::::::\\   \\:::\\    \\   /:::/____/   \\:::\\____\\   ___\\:::\\   \\:::\\    \\  
   /:::/\\:::\\   \\:::\\    \\ |:::|    |     |:::|    | /\\   \\:::\\   \\:::\\    \\ 
  /:::/  \\:::\\   \\:::\\____\\|:::|____|     |:::|    |/::\\   \\:::\\   \\:::\\____\\
  \\::/    \\:::\\  /:::/    / \\:::\\    \\   /:::/    / \\:::\\   \\:::\\   \\::/    /
   \\/____/ \\:::\\/:::/    /   \\:::\\    \\ /:::/    /   \\:::\\   \\:::\\   \\/____/ 
            \\::::::/    /     \\:::\\    /:::/    /     \\:::\\   \\:::\\    \\     
              \\::::/    /       \\:::\\__/:::/    /       \\:::\\   \\:::\\____\\   
              /:::/    /         \\::::::::/    /         \\:::\\  /:::/    /   
             /:::/    /           \\::::::/    /           \\:::\\/:::/    /    
            /:::/    /             \\::::/    /             \\::::::/    /     
           /:::/    /               \\::/____/               \\::::/    /      
           \\::/    /                 ~~                      \\::/    /       
            \\/____/                                           \\/____/         
                                                             
`;

const AppContent = () => {
  const [loggedIn, setLoggedIn] = useState(false);
  const [pid, setPid] = useState(null);
  const [showWalletModal, setShowWalletModal] = useState(false);

  useEffect(() => {
    animation();

    const checkWalletConnection = async () => {
      try {
        if (globalThis.arweaveWallet) {
          const permissions = await globalThis.arweaveWallet.getPermissions();
          if (permissions.includes('SIGN_TRANSACTION') && permissions.includes('ACCESS_ADDRESS')) {
            const address = await globalThis.arweaveWallet.getActiveAddress();
            const pid = await findPid('wallet', address);
            if (pid) {
              setPid(pid);
              setLoggedIn(true);
              return;
            }
          }
        }

        if (globalThis.Wallet) {
          const address = globalThis.Wallet.address;
          if (address) {
            const pid = await findPid('wallet', address);
            if (pid) {
              setPid(pid);
              setLoggedIn(true);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching PID:", error);
      }
    };

    checkWalletConnection();
  }, []);

  const handleLogin = async (inputName) => {
    if (inputName === 'wallet') {
      setShowWalletModal(true);
    } else {
      try {
        const address = globalThis.Wallet
          ? globalThis.Wallet.address
          : await globalThis.arweaveWallet.getActiveAddress();
        const pid = await findPid(inputName, address);
        if (pid) {
          setPid(pid);
          setLoggedIn(true);
        } else {
          const newPid = await register(inputName, address);
          setPid(newPid);
          setLoggedIn(true);
        }
      } catch (error) {
        console.error("Error during login: ", error);
      }
    }
  };

  const handleWalletConnect = async (address) => {
    setShowWalletModal(false);
    try {
      if (!address) {
        throw new Error("Wallet address is required.");
      }
      const pid = await findPid('wallet', address);
      if (pid) {
        setPid(pid);
        setLoggedIn(true);
      } else {
        const newPid = await register('wallet', address);
        setPid(newPid);
        setLoggedIn(true);
      }
    } catch (error) {
      console.error("Error fetching PID:", error);
      alert(`Error fetching PID: ${error.message}`);
    }
  };

  return (
    <div className="App">
      <canvas id="skyCanvas"></canvas>
      {!loggedIn && <LoginForm onLogin={handleLogin} />}
      {loggedIn && <Terminal splashText={splashText} pid={pid} />}
      {showWalletModal && <WalletModal onClose={() => setShowWalletModal(false)} onConnect={handleWalletConnect} />}
    </div>
  );
};

const App = () => (
  <PromptProvider>
    <AppContent />
  </PromptProvider>
);

export default App;
