import React, { useEffect, useState, useRef } from 'react';
import { evaluate, register, live, findPid } from '../api';
import WalletModal from './WalletModal';
import { usePrompt } from '../PromptContext';
import { splash } from '../splash';
import { loadBlueprint } from '../blueprints';
import 'xterm/css/xterm.css';

const Repl = ({ pid: initialPid }) => {
  const [pid, setPid] = useState(initialPid || '');
  const [name, setName] = useState('');
  const [showEditor, setShowEditor] = useState(false);
  const [connected, setConnected] = useState(false);
  const [code, setCode] = useState('');
  const [editorError, setEditorError] = useState('');
  const terminalRef = useRef(null);
  const { prompt, setPrompt } = usePrompt();

  useEffect(() => {
    const terminalElement = terminalRef.current;
    terminalElement.innerHTML = splash() + '\r\n';
    if (globalThis.arweaveWallet) {
      globalThis.arweaveWallet.getPermissions().then((permissions) => {
        if (
          permissions.includes('SIGN_TRANSACTION') &&
          permissions.includes('ACCESS_ADDRESS')
        ) {
          setConnected(true);
          doLive();
        }
      });
    }
    readLine();
  }, []);

  const readLine = () => {
    const terminalElement = terminalRef.current;
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'terminal-input';
    terminalElement.appendChild(input);
    input.focus();
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        processLine(input.value);
        terminalElement.removeChild(input);
      }
    });
  };

  const processLine = async (text) => {
    if (text.trim().length === 0) {
      setTimeout(readLine, 100);
      return;
    }
    const loadBlueprintExp = /\.load-blueprint\s+(\w+)/;
    const matchBlueprint = text.match(loadBlueprintExp);
    if (matchBlueprint) {
      const bpName = matchBlueprint[1];
      text = await loadBlueprint(bpName);
    }
    const loadExp = /\.load/;
    if (loadExp.test(text)) {
      setShowEditor(true);
      return;
    }
    if (/\.editor/.test(text)) {
      setShowEditor(true);
      setTimeout(() => document.getElementById('Code').focus(), 50);
      return;
    }
    if (pid.length === 43) {
      try {
        await evaluate(pid, text, setPrompt);
      } catch (e) {
        setEditorError('ERROR: ' + e.message);
      }
    }

    setTimeout(readLine, 100);
  };

  const doLive = async () => {
    let liveMsg = '';
    const getLiveUpdates = async () => {
      const msg = await live(pid);
      if (msg !== null && msg !== liveMsg) {
        liveMsg = msg;
        liveMsg.split('\n').forEach((m) => console.log('\r' + m));
      }
      setTimeout(getLiveUpdates, 5000);
    };

    setTimeout(getLiveUpdates, 500);
  };

  const doRegister = async () => {
    if (name.length === 0) {
      return;
    }
    try {
      const newPid = await register(name);
      setPid(newPid);
      await evaluate(newPid, 'ao.id', setPrompt);

      doLive();
    } catch (e) {
      setEditorError('Error: ' + e.message);
    }
  };

  const doConnect = async () => {
    if (name.length === 43) {
      setPid(name);
    } else {
      const address = globalThis.Wallet
        ? globalThis.Wallet.address
        : await globalThis.arweaveWallet.getActiveAddress();
      const _pid = await findPid(name, address);
      if (_pid && _pid.length === 43) {
        setPid(_pid);
      } else {
        await doRegister();
        return;
      }
    }
    doLive();
  };

  const doDisconnect = () => {
    setPid('');
    setName('');
  };

  const doLoad = async () => {
    try {
      await evaluate(pid, code, setPrompt);
      setCode('');
      setShowEditor(false);
      setTimeout(readLine, 100);
    } catch (e) {
      setEditorError(e.message);
    }
  };

  const cancelEditor = () => {
    setCode('');
    setShowEditor(false);
    setTimeout(readLine, 100);
  };

  return (
    <div>
      <div className="flex my-4 justify-center">
        {pid ? (
          <>
            <input
              className="border-1 p-2 w-1/2"
              type="text"
              placeholder="processid"
              value={pid}
              onChange={(e) => setPid(e.target.value)}
            />
            <button
              className="ml-2 inline-block rounded border border-indigo-600 px-12 py-3 text-sm font-medium text-indigo-600 hover:bg-indigo-600 hover:text-white focus:outline-none focus:ring active:bg-indigo-500"
              onClick={doDisconnect}
            >
              Disconnect
            </button>
          </>
        ) : (
          <>
            <input
              className="border-1 px-2 mr-4"
              type="text"
              placeholder="name or pid"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <button
              className="uppercase ml-2 inline-block rounded border border-indigo-600 px-12 py-3 text-sm font-medium text-indigo-600 hover:bg-indigo-600 hover:text-white focus:outline-none focus:ring active:bg-indigo-500"
              onClick={doConnect}
            >
              CONNECT
            </button>
          </>
        )}
      </div>
      <div className="flex h-screen w-full">
        <div id="terminal" className="mx-8 w-90% h-screen" ref={terminalRef}></div>
      </div>
      {showEditor && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full" id="my-modal">
          <div className="relative top-20 mx-auto p-5 border w-96 md:w-1/2 shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center pb-3">
              <p className="text-2xl font-bold">Lua Code Editor</p>
              <div
                className="cursor-pointer z-50"
                onClick={cancelEditor}
                role="button"
                tabIndex="0"
                onKeyDown={(e) => {
                  if (e.keyCode === 13 || e.keyCode === 32) {
                    cancelEditor();
                  }
                }}
              >
                <svg
                  className="fill-current text-black"
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 18 18"
                >
                  <path d="M14.53 4.53l-1.06-1.06L9 7.94 4.53 3.47 3.47 4.53 7.94 9l-4.47 4.47 1.06 1.06L9 10.06l4.47 4.47 1.06-1.06L10.06 9z" />
                </svg>
              </div>
            </div>
            <div className="text-center p-5 flex-auto justify-center">
              <div>
                {editorError && <div className="text-red-400">ERROR: {editorError}</div>}
                <textarea
                  id="Code"
                  className="mt-2 w-full rounded-lg border-gray-200 align-top shadow-sm sm:text-sm p-2 font-mono"
                  rows="20"
                  placeholder="Enter code to load into process..."
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                ></textarea>
                <label htmlFor="Code" className="block text-sm font-medium text-gray-700">
                  Code Clipboard (Enter expression and press "Load" to load your process.)
                </label>
              </div>
            </div>
            <div className="p-3 mt-2 text-center space-x-4 md:block">
              <button
                onClick={() => {
                  setCode('');
                  setTimeout(() => document.getElementById('Code').focus(), 50);
                }}
                className="mb-2 md:mb-0 border border-gray-300 px-5 py-2 text-sm shadow-sm font-medium tracking-wider text-gray-600 rounded-full hover:shadow-lg hover:bg-gray-100"
              >
                Clear
              </button>
              <button
                className="mb-2 md:mb-0 bg-blue-500 px-5 py-2 text-sm shadow-sm font-medium tracking-wider text-white rounded-full hover:shadow-lg hover:bg-blue-600"
                onClick={doLoad}
              >
                Load
              </button>
            </div>
          </div>
        </div>
      )}
      {!connected && <WalletModal />}
    </div>
  );
};

export default Repl;
