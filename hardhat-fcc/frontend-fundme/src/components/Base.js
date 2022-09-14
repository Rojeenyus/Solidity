import React, { useState } from "react";
import { ethers } from "ethers";
import { abi, contractAddress } from "./constants";

function Base() {
  const [connect, setConnect] = useState("connect");
  const [ethValue, setEthValue] = useState(0);

  const handleConnect = async () => {
    if (window.ethereum) {
      await window.ethereum.request({ method: "eth_requestAccounts" });
      console.log("metamask connected");
      setConnect("connected");
    }
  };

  const fund = async (eth) => {
    eth = eth.toString();
    if (window.ethereum) {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(contractAddress, abi, signer);
      try {
        const transactionResponse = await contract.fund({
          value: ethers.utils.parseEther(eth),
        });
        await listenForTransactionMine(transactionResponse, provider);
        console.log("done");
      } catch (error) {
        console.log(error);
      }
    }
  };

  const listenForTransactionMine = (transactionResponse, provider) => {
    console.log(`mining ${transactionResponse.hash}...`);
    return new Promise((resolve, reject) => {
      provider.once(transactionResponse.hash, (trans) => {
        console.log(`completed with ${trans.confirmations} confirmations`);
        resolve();
      });
    });
  };

  const getBalance = async () => {
    if (window.ethereum) {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const balance = await provider.getBalance(contractAddress);
      console.log(ethers.utils.formatEther(balance));
    }
  };

  const withdraw = async () => {
    if (window.ethereum) {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(contractAddress, abi, signer);

      try {
        const transactionResponse = await contract.withdraw();
        await listenForTransactionMine(transactionResponse, provider);
        console.log("done");
      } catch (error) {
        console.log(error);
      }
    }
  };

  return (
    <div>
      <button
        onClick={() => {
          handleConnect();
        }}
      >
        {connect}
      </button>
      <button
        onClick={() => {
          getBalance();
        }}
      >
        balance
      </button>
      <button
        onClick={() => {
          withdraw();
        }}
      >
        withdraw
      </button>
      <input
        onChange={(e) => {
          setEthValue(e.target.value);
        }}
        value={ethValue}
        type="number"
        step="0.00001"
      ></input>
      <button
        onClick={() => {
          fund(ethValue);
        }}
      >
        fund
      </button>
    </div>
  );
}

export default Base;
