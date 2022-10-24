import { CircularProgress } from "@material-ui/core";
import Button from "@material-ui/core/Button";
import { CandyMachine } from "@metaplex-foundation/js";
import { useMemo, useState } from "react";
import styled from "styled-components";

export const CTAButton = styled(Button)`
  display: inline-block !important;
  margin: 10px auto !important;
  background-color: #fff !important;
  color: #000 !important;
  min-width: 258px !important;
  font-size: 1em !important;
  font-family: "Patrick Hand", cursive;
  font-weight: bold !important;
`;

export const Minus = styled.button`
  font-size: 2em;
  padding: 25px 35px;
  font-weight: bold;
  line-height: 0.5px;
  color: #000;
  background: #fff;
  box-shadow: 0px 3px 5px -1px rgb(0 0 0 / 20%),
    0px 6px 10px 0px rgb(0 0 0 / 14%), 0px 1px 18px 0px rgb(0 0 0 / 12%);
  border: 0;
  border-radius: 5px;
  box-sizing: border-box;
  font-family: "Patrick Hand", cursive;
  vertical-align: middle;
  transition: all linear 0.3s;

  :hover {
    border: none;
    outline: none !important;
    background: #d09a69;
  }
  :not(disabled) {
    cursor: pointer;
  }

  :not(disabled):hover {
    outline: 1px solid var(--title-text-color);
  }
`;

export const Plus = styled(Minus)`
  margin-left: 0;
`;

export const NumericField = styled.input`
  font-size: 2em !important;
  padding: 0;
  vertical-align: middle;
  background-color: var(--main-text-color);
  box-shadow: 0px 3px 5px -1px rgb(0 0 0 / 20%),
    0px 6px 10px 0px rgb(0 0 0 / 14%), 0px 1px 18px 0px rgb(0 0 0 / 12%);
  box-sizing: border-box;
  font-family: "Patrick Hand", cursive;
  font-weight: 500;
  line-height: 1px;
  border: none;
  text-align: center;
  border-radius: 5px;
  transition: all 0.4s ease;
  -moz-appearance: textfield;
  -webkit-appearance: none;
  margin: 0 10px;

  :hover,
  :focus {
    box-shadow: 0px 3px 5px -1px rgb(0 0 0 / 40%),
      0px 6px 10px 0px rgb(0 0 0 / 34%), 0px 1px 18px 0px rgb(0 0 0 / 32%);
  }

  ::-webkit-outer-spin-button,
  ::-webkit-inner-spin-button {
    -webkit-appearance: none;
  }
`;

export const MultiMintButton = ({
  onMint,
  candyMachine,
  isMinting,
  isEnded,
  isActive,
  isSoldOut,
  price,
}: {
  onMint: (quantityString: number) => Promise<void>;
  candyMachine: CandyMachine | undefined;
  isMinting: boolean;
  isEnded: boolean;
  isActive: boolean;
  isSoldOut: boolean;
  price: number;
}) => {
  const [loading, setLoading] = useState(false);

  const [mintCount, setMintCount] = useState(1);
  const [totalCost, setTotalCost] = useState(mintCount * (price + 0.012));

  function incrementValue() {
    var numericField = document.querySelector(".mint-qty") as HTMLInputElement;
    if (numericField) {
      var value = parseInt(numericField.value);
      if (!isNaN(value) && value < 10) {
        value++;
        numericField.value = "" + value;
        updateAmounts(value);
      }
    }
  }

  function decrementValue() {
    var numericField = document.querySelector(".mint-qty") as HTMLInputElement;
    if (numericField) {
      var value = parseInt(numericField.value);
      if (!isNaN(value) && value > 1) {
        value--;
        numericField.value = "" + value;
        updateAmounts(value);
      }
    }
  }

  function updateMintCount(target: any) {
    var value = parseInt(target.value);
    if (!isNaN(value)) {
      if (value > 10) {
        value = 10;
        target.value = "" + value;
      } else if (value < 1) {
        value = 1;
        target.value = "" + value;
      }
      updateAmounts(value);
    }
  }

  function updateAmounts(qty: number) {
    setMintCount(qty);
    setTotalCost(Math.round(qty * (price + 0.012) * 1000) / 1000); // 0.012 = approx of account creation fees
  }
  const disabled = useMemo(
    () => loading || isSoldOut || isMinting || isEnded || !isActive,
    [loading, isSoldOut, isMinting, isEnded, !isActive]
  );
  return (
    <div>
      <div>
        <Minus disabled={disabled} onClick={() => decrementValue()}>
          <span style={{ marginTop: "-5px !important" }}>-</span>
        </Minus>
        <NumericField
          disabled={disabled}
          type="number"
          className="mint-qty"
          step={1}
          min={1}
          max={10}
          value={mintCount}
          onChange={(e) => updateMintCount(e.target as any)}
        />
        <Plus disabled={disabled} onClick={() => incrementValue()}>
          +
        </Plus>

        <br />
        <CTAButton
          disabled={disabled}
          onClick={async () => {
            console.log("Minting...");
            setLoading(true);
            await onMint(mintCount);
            setLoading(false);
          }}
          variant="contained"
        >
          {!candyMachine ? (
            "CONNECTING..."
          ) : isSoldOut ? (
            "SOLD OUT"
          ) : isActive ? (
            isMinting || loading ? (
              <CircularProgress />
            ) : (
              "MINT"
            )
          ) : isEnded ? (
            "ENDED"
          ) : (
            "UNAVAILABLE"
          )}
        </CTAButton>
      </div>
      {!isSoldOut && isActive && (
        <h3>Total estimated cost (Solana fees included) : {totalCost} SOL</h3>
      )}
    </div>
  );
};
