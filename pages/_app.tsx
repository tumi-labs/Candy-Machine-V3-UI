import React from "react";
import "@solana/wallet-adapter-react-ui/styles.css";
import "../styles/globals.css";

const App = ({ Component, pageProps }) => {
  return <Component {...pageProps} />;
};

export default App;
