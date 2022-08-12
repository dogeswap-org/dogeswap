import React, { useState } from "react";

interface DismissableProps {
    onDismiss: () => void;
}

const HomeMessage = ({ onDismiss }: DismissableProps) => {
    const [iUnderstand, setIUnderstandValue] = useState(false);
    return (
        <>
            <h1>User Warning!</h1>
            <ol>
                <li>
                    DogeSwap is currently in Beta and has not yet had any audits completed. There could be bugs with the
                    code that could result in loss of user funds.
                    <br />
                    <br />
                </li>
                <li>
                    DogeSwap is decentralised, so anybody can list a token. We do not endorse nor guarantee the
                    legitimacy of any tokens listed on DogeSwap, and there are a number of ways that buying these tokens
                    could result in 100% loss.
                    <br />
                    <br />
                </li>
                <li>
                    We did not expect such heavy use of DogeSwap immediately. It's great that everybody is excited, but
                    we were expecting maybe a few small transactions of people buying and selling OMNOM (our joke/meme
                    token just to try DogeSwap out and help us add new features). If you are swapping anything other
                    than OMNOM, we are unable to offer user support for this. Many tokens have non-standard transfer
                    functions when selling the tokens, and some might turn out to be scams.
                    <br />
                    <br />
                </li>
            </ol>
            <div>
                <label style={{ paddingRight: 16 }}>
                    <input
                        type="checkbox"
                        checked={iUnderstand}
                        onChange={(x) => setIUnderstandValue(x.currentTarget.checked)}
                    />
                    I understand
                </label>
                <button onClick={() => onDismiss()} disabled={!iUnderstand}>
                    Dismiss
                </button>
            </div>
        </>
    );
};

const OtherMessage = ({ onDismiss }: DismissableProps) => {
    const [iUnderstand1, setIUnderstand1] = useState(false);
    const [iUnderstand2, setIUnderstand2] = useState(false);
    const [iUnderstand3, setIUnderstand3] = useState(false);
    return (
        <>
            <h1>User Warning!</h1>
            <ol>
                <li>
                    ⚠️ It looks like you've been directed to swap tokens here. The tokens you're swapping have been
                    created by a 3rd party and have not been vetted nor endorsed by DogeSwap. It's possible that this is
                    a scam and you will lose 100% of your funds. Please do your own research, and do not trust links
                    sent by 3rd parties.
                    <br />
                    <br />
                    <label style={{ paddingRight: 16 }}>
                        <input
                            type="checkbox"
                            checked={iUnderstand1}
                            onChange={(x) => setIUnderstand1(x.currentTarget.checked)}
                        />
                        I understand
                    </label>
                    <br />
                    <br />
                </li>
                <li>
                    ⚠️ We do not offer support for tokens other than OMNOM at this stage. Many tokens have non-standard
                    transfer functions when selling or transferring the tokens, and some tokens might turn out to be
                    scams.
                    <br />
                    <br />
                    <label style={{ paddingRight: 16 }}>
                        <input
                            type="checkbox"
                            checked={iUnderstand2}
                            onChange={(x) => setIUnderstand2(x.currentTarget.checked)}
                        />
                        I understand
                    </label>
                    <br />
                    <br />
                </li>
                <li>
                    ⚠️ DogeSwap is currently in Beta and has not yet had any audits completed. There could be bugs with
                    the code that could result in loss of user funds.
                    <br />
                    <br />
                    <label style={{ paddingRight: 16 }}>
                        <input
                            type="checkbox"
                            checked={iUnderstand3}
                            onChange={(x) => setIUnderstand3(x.currentTarget.checked)}
                        />
                        I understand
                    </label>
                    <br />
                    <br />
                </li>
            </ol>
            <div>
                <button onClick={() => onDismiss()} disabled={!iUnderstand1 || !iUnderstand2 || !iUnderstand3}>
                    Dismiss
                </button>
            </div>
        </>
    );
};

export const DisclaimerPopup = () => {
    const [isDismissed, setIsDismissed] = useState(false);
    return isDismissed ? (
        <></>
    ) : (
        <div
            style={{
                backgroundColor: "rgba(0, 0, 0, 0.8)",
                display: "flex",
                height: "100vh",
                width: "100vw",
                alignItems: "center",
                justifyContent: "center",
                position: "fixed",
                zIndex: 1000,
            }}
        >
            <div style={{ backgroundColor: "white", margin: 32, padding: 16 }}>
                {window.location.hash === "#/swap" ? (
                    <HomeMessage onDismiss={() => setIsDismissed(true)} />
                ) : (
                    <OtherMessage onDismiss={() => setIsDismissed(true)} />
                )}
            </div>
        </div>
    );
};
