import React, { useState, useEffect } from 'react';
import { live, evaluate } from '../api';
import { usePrompt } from '../PromptContext';

const stripAnsi = (str) => {
  return str.replace(
    /[\u001B\u009B][[()#;?]*(?:(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-PR-TZcf-nq-uy=><~])?/g,
    ''
  );
};

const formatJson = (data) => {
  if (typeof data !== 'object') return data;

  return (
    <pre style={{ marginLeft: '20px' }}>
      {Object.entries(data).map(([key, value], index) => (
        <div key={index}>
          <span className="json-key">{key}: </span>
          <span className="json-value">{JSON.stringify(value, null, 2)}</span>
        </div>
      ))}
    </pre>
  );
};

const Terminal = ({ splashText, pid }) => {
  const [commands, setCommands] = useState([]);
  const [input, setInput] = useState('');
  const { prompt, setPrompt } = usePrompt();

  useEffect(() => {
    const fetchLiveUpdates = async () => {
      try {
        const liveData = await live(pid);
        if (liveData) {
          setCommands((prevCommands) => [
            ...prevCommands,
            { type: 'live', data: stripAnsi(liveData) },
          ]);
        }
      } catch (error) {
        console.error(error);
      }
    };

    const interval = setInterval(fetchLiveUpdates, 5000);
    return () => clearInterval(interval);
  }, [pid]);

  const handleCommand = async (e) => {
    e.preventDefault();
    try {
      const result = await evaluate(pid, input, setPrompt);
      setCommands((prevCommands) => [
        ...prevCommands,
        { type: 'command', text: `${prompt}${input}` },
        { type: 'result', data: stripAnsi(result || input) },
      ]);
      setInput('');
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="terminal">
      <pre className="splash">{splashText}</pre>
      <div className="output">
        {commands.map((command, index) => (
          <div key={index}>
            {command.type === 'command' && <div className="command">{command.text}</div>}
            {command.type === 'result' && <div className="output-line">{formatJson(command.data)}</div>}
            {command.type === 'live' && <div className="output-line">{formatJson(command.data)}</div>}
          </div>
        ))}
      </div>
      <form onSubmit={handleCommand}>
        <input
          className="input"
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a command..."
        />
      </form>
    </div>
  );
};

export default Terminal;
