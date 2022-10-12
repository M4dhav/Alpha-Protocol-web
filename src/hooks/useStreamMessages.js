import { useState, useEffect, useContext } from "react";
import { WalletContext } from "../contexts/WalletContext";
import { XmtpContext } from "../contexts/XmtpContext";

const useStreamMessages = (peerAddress) => {
  const { walletAddress } = useContext(WalletContext);
  const [providerState, setProviderState] = useContext(XmtpContext);
  const { client, convoMessages } = providerState;
  const [stream, setStream] = useState("");

  useEffect(() => {
    if (!peerAddress) return;

    const streamMessages = async () => {
      const conversation = await client.conversations.newConversation(peerAddress)
      const newStream = await conversation?.streamMessages();
      setStream(newStream);
      for await (const msg of newStream) {
        if (setProviderState) {
          const newMessages = convoMessages.get(conversation.peerAddress) ?? [];
          newMessages.push(msg);
          const uniqueMessages = [
            ...Array.from(
              new Map(newMessages.map((item) => [item["id"], item])).values()
            ),
          ];
          convoMessages.set(conversation.peerAddress, uniqueMessages);
          setProviderState({
            ...providerState,
            convoMessages: new Map(convoMessages),
          });
        }
      }
    };
    streamMessages();
    
    return () => {
      const closeStream = async () => {
        if (!stream) return;
        await stream.return();
      };
      closeStream();
    };
    // eslint-disable-next-line
  }, [convoMessages, walletAddress]);

};

export default useStreamMessages;
