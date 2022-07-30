import MetamaskIcon from "../../../assets/embedded/metamask.png";

export const getWalletIcon = (iconName: string) => {
    switch (iconName) {
        case "metamask.png":
            return MetamaskIcon;
        default:
            return "";
    }
};
