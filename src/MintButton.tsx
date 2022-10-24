import { CircularProgress } from "@material-ui/core";
import Button from "@material-ui/core/Button";
import { CandyMachine } from "@metaplex-foundation/js";
import { useState } from "react";
import styled from "styled-components";

export const CTAButton = styled(Button)`
  display: block !important;
  margin: 0 auto !important;
  background-color: var(--title-text-color) !important;
  min-width: 120px !important;
  font-size: 1em !important;
`;

export const MintButton = ({
  onMint,
  candyMachine,
  isMinting,
  isEnded,
  isActive,
  isSoldOut,
  limitReached
}: {
  onMint: (quantityString: number) => Promise<void>;
  candyMachine: CandyMachine | undefined;
  isMinting: boolean;
  isEnded: boolean;
  isActive: boolean;
  isSoldOut: boolean;
  limitReached: boolean;
}) => {
  const [loading, setLoading] = useState(false);

  return (
    <CTAButton
      disabled={loading || isSoldOut || isMinting || isEnded || !isActive || limitReached}
      onClick={async () => {
        console.log("Minting...");
        setLoading(true);
        await onMint(1);
        setLoading(false);
      }}
      variant="contained"
    >
      {!candyMachine ? (
        "CONNECTING..."
      ) : isSoldOut ? (
        "SOLD OUT"
      ) : limitReached ? (
        "LIMIT REACHED"
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
  );
};
