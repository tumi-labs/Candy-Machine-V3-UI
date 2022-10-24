import styled from 'styled-components';

export const StyledContainer = styled('div')<any>`
  position: relative;
  width: 100%;
  max-width: 1200px;
  margin-right: auto;
  margin-left: auto;
  padding: 0 60px;
  border-top: ${(p) => (p.border ? '1px solid #CDD1D4' : '')};
  @media only screen and (max-width: 1024px) {
    max-width: calc(100% - 68px);
    padding: 0 30px;
  }

  @media only screen and (max-width: 768px) {
    max-width: calc(100% - 38px);
    padding: 0 18px;
  }

  @media only screen and (max-width: 414px) {
    max-width: 100%;
    padding: 0 18px;
  }
`;

export const Root = styled('div')`
  position: relative;
  z-index: 99;
  .cloud-content {
    bottom: 0;
    left: 0;
    padding-top: 50px;
    position: fixed;
    right: 0;
    top: 0;
    z-index: -1;
  }

  .cloud-block {
    position: absolute;
    opacity: 0.4;
  }
  .cloud-1 {
    top: 50px;
  }
  .cloud-2 {
    top: 40vh;
  }
  .cloud-3 {
    top: 20vh;
  }
  .cloud-4 {
    top: 40vh;
  }
  .cloud-5 {
    top: 65vh;
  }
  .cloud-6 {
    top: 35vh;
  }
  .cloud-7 {
    bottom: 30px;
  }

  .cloud-1 {
    animation: animate-1 32s linear infinite;
    -webkit-animation: animate-1 83s linear infinite;
    transform: scale(0.75);
    -webkit-transform: scale(0.95);
  }

  .cloud-2 {
    animation: animate-2 37s linear infinite;
    -webkit-animation: animate-2 87s linear infinite;
    transform: scale(0.45);
    -webkit-transform: scale(0.45);
  }

  .cloud-3 {
    animation: animate-3 45s linear infinite;
    -webkit-animation: animate-3 85s linear infinite;
    transform: scale(0.5);
    -webkit-transform: scale(0.5);
  }

  .cloud-4 {
    animation: animate-4 50s linear infinite;
    -webkit-animation: animate-4 100s linear infinite;
    transform: scale(0.8);
    -webkit-transform: scale(0.2);
  }

  .cloud-5 {
    animation: animate-5 55s linear infinite;
    -webkit-animation: animate-5 105s linear infinite;
    transform: scale(0.55);
    -webkit-transform: scale(0.55);
  }

  .cloud-6 {
    animation: animate-6 60s linear infinite;
    -webkit-animation: animate-6 110s linear infinite;
    transform: scale(0.85);
    -webkit-transform: scale(0.85);
  }

  .cloud-7 {
    animation: animate-7 65s linear infinite;
    -webkit-animation: animate-7 115s linear infinite;
    transform: scale(0.5);
    -webkit-transform: scale(0.5);
  }

  /* Cloud Objects */

  .cloud {
    width: 350px;
    height: 350px;
    box-shadow: 0 16px 16px rgba(0, 0, 0, 0.1);
    -webkit-box-shadow: 0 16px 16px rgba(0, 0, 0, 0.1);
    position: relative;
    background: url(/mf.png);
    background-repeat: no-repeat;
  }

  // .cloud:after,
  // .cloud:before {
  //   background: #fff;
  //   content: '';
  //   position: absolute;
  //   z-index: -1;
  // }

  // .cloud:after {
  //   width: 100px;
  //   height: 100px;
  //   left: 50px;
  //   top: -50px;
  //   border-radius: 100px;
  // }

  // .cloud:before {
  //   width: 180px;
  //   height: 180px;
  //   right: 50px;
  //   top: -90px;
  //   border-radius: 200px;
  // }

  /* KEYFRAMES */

  @keyframes animate-1 {
    0% {
      left: 90%;
    }
    10% {
      left: 110%;
    }
    10.001% {
      left: -10%;
    }
    100% {
      left: 90%;
    }
  }

  @keyframes animate-2 {
    0% {
      left: 75%;
    }
    25% {
      left: 110%;
    }
    25.001% {
      left: -10%;
    }
    100% {
      left: 75%;
    }
  }

  @keyframes animate-3 {
    0% {
      left: 60%;
    }
    40% {
      left: 110%;
    }
    40.001% {
      left: -10%;
    }
    100% {
      left: 60%;
    }
  }

  @keyframes animate-4 {
    0% {
      left: 45%;
    }
    55% {
      left: 110%;
    }
    55.001% {
      left: -10%;
    }
    100% {
      left: 45%;
    }
  }

  @keyframes animate-5 {
    0% {
      left: 30%;
    }
    70% {
      left: 110%;
    }
    70.001% {
      left: -10%;
    }
    100% {
      left: 30%;
    }
  }

  @keyframes animate-6 {
    0% {
      left: 10%;
    }
    90% {
      left: 110%;
    }
    90.001% {
      left: -10%;
    }
    100% {
      left: 10%;
    }
  }

  @keyframes animate-7 {
    0% {
      left: -10%;
    }

    99.99% {
      left: 110%;
    }
    100% {
      left: -10%;
    }
  }

  /* ANIMATIONS */

  .sun {
    margin: 0px auto;
    width: 170px;
    height: 170px;
    border-radius: 100%;
    background-color: #fcc952;
    background-image: linear-gradient(
      145deg,
      rgba(252, 201, 82, 1) 0%,
      rgba(252, 201, 82, 1) 61%,
      rgba(248, 160, 55, 1) 100%
    );
    -webkit-background-image: linear-gradient(
      145deg,
      rgba(252, 201, 82, 1) 0%,
      rgba(252, 201, 82, 1) 61%,
      rgba(248, 160, 55, 1) 100%
    );
    box-shadow: inset 2px 2px 8px 0 rgba(252, 201, 82, 0),
      inset -3px -3px 8px 0 rgba(245, 169, 76, 0),
      6px 6px 18px 0 rgba(204, 123, 35, 0.35),
      -6px -6px 18px 0 rgba(205, 157, 35, 0.5);
    -webkit-box-shadow: inset 2px 2px 8px 0 rgba(252, 201, 82, 0),
      inset -3px -3px 8px 0 rgba(245, 169, 76, 0),
      6px 6px 18px 0 rgba(204, 123, 35, 0.35),
      -6px -6px 18px 0 rgba(205, 157, 35, 0.5);
    position: relative;
    z-index: 2;
  }
  .sunlight-content {
    bottom: 0;
    left: 50%;
    position: fixed;
    right: 0;
    top: 50%;
    transform: translate(-50%, -50%);
    -webkit-transform: translate(-50%, -50%);
    width: max-content;
    height: max-content;
  }
  .sun-face {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    -webkit-transform: translate(-50%, -50%);
  }
  .eyes-block {
    width: 80px;
    display: flex;
    display: -webkit-flex;
    justify-content: space-between;
    -webkit-justify-content: space-between;
  }
  .eyes {
    background-color: #2e261a;
    width: 20px;
    height: 20px;
    border-radius: 100%;
    display: inline-flex;
    display: -webkit-inline-flex;
    position: relative;
  }
  .eyes:before {
    content: '';
    height: 6px;
    width: 6px;
    display: block;
    position: absolute;
    top: 3px;
    background-color: #fff;
    border-radius: 100%;
    animation: Rotate-eye 4s ease-in-out alternate infinite;
    -webkit-animation: Rotate-eye 4s ease-in-out alternate infinite;
  }
  .mouth {
    width: 18px;
    height: 18px;
    background-color: #2f261a;
    text-align: center;
    margin: 0px auto;
    position: absolute;
    overflow: hidden;
    border-radius: 0px 0px 25px 25px;
    left: 50%;
    transform: translateX(-50%);
    -webkit-transform: translateX(-50%);
    top: 100%;
    animation: scale-mouth 2s linear infinite;
    -webkit-animation: scale-mouth 2s linear infinite;
  }
  .tongue {
    width: 100%;
    height: 16px;
    background-color: #f54b2e;
    border-radius: 100%;
    position: absolute;
    bottom: -6px;
    left: 0;
    animation: scale-tongue 2s linear infinite;
    -webkit-animation: scale-tongue 2s linear infinite;
  }

  .sunlight-box {
    filter: drop-shadow(0px 0px 12px rgba(252, 201, 82, 0.8));
    height: 100%;
    width: 100%;
    position: absolute;
    top: 0;
    left: 0;
    animation: Rotate 20s linear infinite;
    -webkit-animation: Rotate 20s linear infinite;
  }
  .sunlight-box span {
    height: 170px;
    width: 170px;
    background-color: #f8a037;
    position: absolute;
    top: 0px;
    left: 0px;
    z-index: 1;
  }
  .sunlight-box span:first-child {
    transform: rotate(30deg);
    -webkit-transform: rotate(30deg);
  }
  .sunlight-box span:nth-child(2) {
    transform: rotate(60deg);
    -webkit-transform: rotate(60deg);
  }
  .sunlight-box span:nth-child(3) {
    transform: rotate(90deg);
    -webkit-transform: rotate(90deg);
  }

  /* keyframe animation */
  @keyframes Rotate {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }

  @-webkit-keyframes Rotate {
    from {
      -webkit-transform: rotate(0deg);
    }
    to {
      -webkit-transform: rotate(360deg);
    }
  }

  @keyframes Rotate-eye {
    0%,
    35% {
      right: 3px;
    }
    65%,
    100% {
      right: 10px;
    }
  }

  @-webkit-keyframes Rotate-eye {
    0%,
    35% {
      right: 3px;
    }
    65%,
    100% {
      right: 10px;
    }
  }

  @keyframes scale-mouth {
    0% {
      height: 18px;
    }

    100% {
      height: 24px;
    }
  }

  @-webkit-keyframes scale-mouth {
    0% {
      height: 18px;
    }

    100% {
      height: 24px;
    }
  }

  @keyframes scale-tongue {
    0% {
      height: 16px;
    }

    100% {
      height: 20px;
    }
  }

  @-webkit-keyframes scale-tongue {
    0% {
      height: 16px;
    }

    100% {
      height: 20px;
    }
  }

  /* Responsive media query */
  @media screen and (max-width: 767px) {
    .sun {
      width: 140px;
      height: 140px;
    }
    .sunlight-box span {
      height: 140px;
      width: 140px;
    }
    .cloud {
      width: 150px;
      height: 260px;
    }
    // .cloud:before {
    //   width: 120px;
    //   height: 120px;
    //   top: -80px;
    //   right: 50px;
    // }
    .eyes-block {
      width: 70px;
    }
    .eyes {
      width: 18px;
      height: 18px;
    }
    .eyes:before {
      height: 5px;
      width: 5px;
    }
    .mouth {
      width: 15px;
      height: 15px;
    }
    .tongue {
      bottom: -8px;
    }
    /* KEYFRAMES */

    @keyframes scale-mouth {
      0% {
        height: 15px;
      }

      100% {
        height: 22px;
      }
    }

    @-webkit-keyframes scale-mouth {
      0% {
        height: 15px;
      }

      100% {
        height: 22px;
      }
    }

    @keyframes scale-tongue {
      0% {
        height: 14px;
      }

      100% {
        height: 20px;
      }
    }

    @-webkit-keyframes scale-tongue {
      0% {
        height: 14px;
      }

      100% {
        height: 20px;
      }
    }

    .cloud-1 {
      animation: animate-1 32s linear infinite;
      -webkit-animation: animate-1 43s linear infinite;
      transform: scale(0.45);
      -webkit-transform: scale(0.45);
    }

    .cloud-2 {
      animation: animate-2 37s linear infinite;
      -webkit-animation: animate-2 47s linear infinite;
      transform: scale(0.25);
      -webkit-transform: scale(0.25);
    }

    .cloud-3 {
      animation: animate-3 45s linear infinite;
      -webkit-animation: animate-3 45s linear infinite;
      transform: scale(0.3);
      -webkit-transform: scale(0.3);
    }

    .cloud-4 {
      animation: animate-4 50s linear infinite;
      -webkit-animation: animate-4 60s linear infinite;
      transform: scale(0.6);
      -webkit-transform: scale(0.6);
    }

    .cloud-5 {
      animation: animate-5 55s linear infinite;
      -webkit-animation: animate-5 65s linear infinite;
      transform: scale(0.45);
      -webkit-transform: scale(0.45);
    }

    .cloud-6 {
      animation: animate-6 60s linear infinite;
      -webkit-animation: animate-6 70s linear infinite;
      transform: scale(0.55);
      -webkit-transform: scale(0.55);
    }

    .cloud-7 {
      animation: animate-7 65s linear infinite;
      -webkit-animation: animate-7 75s linear infinite;
      transform: scale(0.3);
      -webkit-transform: scale(0.3);
    }

    .marquee {
      -webkit-animation-duration: 30s;
      animation-duration: 30s;
    }
  }

  // .wallet-adapter-modal-wrapper {
  //   background: #ffffff;
  // }

  // .wallet-adapter-button {
  //   background-color: #000000;
  // }

  // .wallet-adapter-modal-list {
  //   margin: 0 0 4px !important;
  // }
  // .wallet-adapter-modal-list li:not(:first-of-type) {
  //   margin-top: 4px !important;
  // }

  // .wallet-adapter-modal-title {
  //   color: #000000;
  // }
`;

export const Hero = styled('div')`
  text-align: center;
  margin: 80px 0 80px;
`;
export const MintCount = styled('h3')`
  font-family: 'Patrick Hand', cursive;
  font-size: 30px;
  line-height: 1;
  margin-bottom: 20px;
  margin-top: 25px;
  font-weight: 700;
`;
export const Heading = styled('h1')`
  font-family: nabana;
  letter-spacing: 2px;
  margin-bottom: -20px;
  color: #897ea5;
  font-size: 60px;
`;
export const MintButtonStyled = styled('button')`
  border: 0.1px solid #424242;
  background: #000000b0;
  border-radius: 10px;
  padding: 6px;
  font-size: 28px;
  min-width: 300px;
  box-shadow: 2px 3px 1px 0px #fff;
  cursor: pointer;
  transition: all 0.3s ease-in-out;

  :hover {
    background: #0000;
  }
`;
export const NftWrapper = styled('div')`
  position: relative;
  z-index: 99;
  .marquee-wrapper {
    overflow: hidden;
    transform: skew(360deg, 356deg);
  }

  .marquee {
    display: flex;
    animation-name: marquee;
    animation-duration: 50s;
    animation-iteration-count: infinite;
    animation-timing-function: linear;
    animation-direction: alternate;
    transform: translateX(0);
    img {
      padding: 5px;
      max-width: 200px;
      border-radius: 10px;
    }
  }

  @keyframes marquee {
    from {
      transform: translateX(0);
    }
    to {
      transform: translateX(-100%);
    }
  }
`;
export const NftWrapper2 = styled('div')`
  position: relative;
  z-index: 99;
  .marquee-wrapper {
    overflow: hidden;
    transform: skew(360deg, 356deg);
  }

  .marquee {
    display: flex;
    animation-name: marquee2;
    animation-duration: 50s;
    animation-iteration-count: infinite;
    animation-timing-function: linear;
    animation-direction: alternate;
    transform: translateX(0);

    img {
      padding: 5px;
      max-width: 200px;
      border-radius: 10px;
    }
  }

  @keyframes marquee2 {
    from {
      transform: translateX(-100%);
    }
    to {
      transform: translateX(0);
    }
  }
`;
