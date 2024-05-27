import React from 'react';
import { ArweaveWebWallet } from "arweave-wallet-connector";
import * as othent from "@othent/kms";

const WalletModal = ({ onClose, onConnect }) => {
  const arConnect = async () => {
    try {
      await globalThis.arweaveWallet.connect(["SIGN_TRANSACTION", "ACCESS_ADDRESS"]);
      const address = await globalThis.arweaveWallet.getActiveAddress();
      onConnect(address);
      alert('Connected to AR Connect');
    } catch (err) {
      alert(`Failed to connect to AR Connect: ${err.message}`);
    }
  };

  const arweaveApp = async () => {
    try {
      globalThis.Wallet = new ArweaveWebWallet({
        name: "AOS-WEB",
      });
      globalThis.Wallet.setUrl("arweave.app");
      await globalThis.Wallet.connect();
      const address = globalThis.Wallet.address;
      onConnect(address);
      alert('Connected to ARWEAVE.APP');
    } catch (err) {
      alert(`Failed to connect to ARWEAVE.APP: ${err.message}`);
    }
  };

  const othentConnect = async () => {
    try {
      globalThis.arweaveWallet = othent;
      await othent.connect(["SIGN_TRANSACTION", "ACCESS_ADDRESS"]);
      const address = await othent.getActiveAddress();
      onConnect(address);
      alert('Connected to Othent');
    } catch (err) {
      alert(`Failed to connect to Othent: ${err.message}`);
    }
  };

  return (
    <div className="modal">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Connect Wallet</h2>
        </div>
        <div className="modal-body">
          <label>Select Arweave Wallet</label>
          <button onClick={arConnect}>AR CONNECT</button>
          <button onClick={arweaveApp}>ARWEAVE.APP</button>
          <button onClick={othentConnect}>Othent</button>
        </div>
        <div className="modal-footer">
          <a href="https://arconnect.io" target="_blank" rel="noopener noreferrer">Don't have an Arweave Wallet?</a>
          <button onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};

export default WalletModal;
