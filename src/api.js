import { connect, createDataItemSigner } from '@permaweb/aoconnect';

// Find PID function
export async function findPid(name, address) {
  if (!name || !address) {
    throw new Error("Name and address are required");
  }

  const query = generateQuery(name, address);

  try {
    const response = await fetch("https://arweave-search.goldsky.com/graphql", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ query })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    if (data.data && data.data.transactions && data.data.transactions.edges.length > 0) {
      return data.data.transactions.edges[0].node.id;
    } else {
      return undefined;
    }
  } catch (error) {
    throw new Error(`Failed to fetch PID: ${error.message}`);
  }
}

function generateQuery(name, address) {
  return `query {
    transactions(owners: ["${address}"], tags: [
      {name: "Name", values: ["${name}"]},
      {name: "Type", values: ["Process"]},
      {name: "Variant", values: ["ao.TN.1"]},
      {name: "Data-Protocol", values: ["ao"]}
    ]) {
      edges {
        node {
          id
        }
      }
    }
  }`;
}

// Live function
let cursor = "";
export async function live(pid) {
  try {
    const results = await connect().results({
      process: pid,
      sort: "DESC",
      from: cursor,
      limit: 1
    });

    const xnode = results.edges.find(x => x.node.Output.print === true);
    if (xnode) {
      cursor = xnode.cursor;
      return xnode.node.Output.data;
    }
    return null;
  } catch (error) {
    throw new Error(`Error fetching live results: ${error.message}`);
  }
}

// Register function
const MODULE = "1PdCJiXhNafpJbvC-sjxWTeNzbf9Q_RfUNs84GYoPm0";
const SCHEDULER = "_GQ33BkPtZrqxA84vM8Zk-N2aO0toNNu_C-l-rawrBA";

export async function register(name, address) {
  if (!globalThis.arweaveWallet) {
    throw new Error('ArConnect is Required!');
  }

  const aos = connect();
  const signer = createDataItemSigner(globalThis.Wallet || globalThis.arweaveWallet);

  try {
    const pid = await aos.spawn({
      module: MODULE,
      scheduler: SCHEDULER,
      signer,
      tags: [
        { name: 'Name', value: name },
        { name: 'Address', value: address },
        { name: 'Version', value: 'web-0.0.1' }
      ],
      data: '1984'
    });

    await new Promise(resolve => setTimeout(resolve, 3000));
    return pid;
  } catch (error) {
    throw new Error(`Error registering: ${error.message}`);
  }
}

// Evaluate function
export async function evaluate(pid, data, setPrompt) {
  const signer = createDataItemSigner(globalThis.Wallet || globalThis.arweaveWallet);

  try {
    const messageId = await connect().message({
      process: pid,
      signer,
      tags: [{ name: 'Action', value: 'Eval' }],
      data
    });

    const result = await connect().result({
      message: messageId,
      process: pid
    });

    if (result.Error) {
      throw new Error(JSON.stringify(result.Error));
    }

    if (result.Output?.data?.prompt) {
      setPrompt(result.Output.data.prompt);
    }

    if (result.Output?.data?.output) {
      return result.Output.data.output;
    }

    return undefined;
  } catch (error) {
    throw new Error(`Error evaluating: ${error.message}`);
  }
}
