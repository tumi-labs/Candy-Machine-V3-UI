import { PublicKey } from "@solana/web3.js";
import Home from "../src/Home";
require("@solana/wallet-adapter-react-ui/styles.css");

const candyMachineId = new PublicKey(
  process.env.NEXT_PUBLIC_CANDY_MACHINE_ID ||
    "Cmty5uyqzvfAzRbEoiMdtTfRJR7dWkbWdXiBkrYKQSn1"
);

const App = () => {
  return <Home candyMachineId={candyMachineId} />;
};

export default App;
