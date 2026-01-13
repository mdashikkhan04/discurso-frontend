'use client';

import { getRealtimeKey } from "@/actions/ai";
import { getNiceNum } from "@/lib/util";

const TOKEN_COSTS = {
    "gpt-realtime": {
        text: { input: 0.004, output: 0.016 },
        audio: { input: 0.032, output: 0.064 }
    },
    "gpt-realtime-mini": {
        text: { input: 0.0006, output: 0.0024 },
        audio: { input: 0.01, output: 0.02 }
    }
};

function createSilentAudioTrack() {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    const destination = audioContext.createMediaStreamDestination();
    gainNode.connect(destination);

    oscillator.start();

    return {
        stream: destination.stream,
        audioContext: audioContext
    };
}

export function createClient({
    caseId, userId, aiModel, aiSide, behaviourParams, withAudio, voice,
    audioElId = "oai-remote-audio", onUsage, onError, onMessage, onConnected
}) {
    let pc, dc, micStream, connected = false, audioContext = null;

    const model = aiModel.split("=")[1].trim();

    const totals = {
        input: 0,  // total input tokens
        output: 0, // total output tokens
        textIn: 0,
        textOut: 0,
        audioIn: 0,
        audioOut: 0,
    };

    function addUsage(u) {
        const inDet = u.input_token_details || {};
        const outDet = u.output_token_details || {};
        const tIn = inDet.text_tokens ?? 0;
        const aIn = inDet.audio_tokens ?? 0;
        const tOut = outDet.text_tokens ?? 0;
        const aOut = outDet.audio_tokens ?? 0;
        totals.textIn += tIn;
        totals.textOut += tOut;
        totals.audioIn += aIn;
        totals.audioOut += aOut;
        totals.input += (u.input_tokens || 0);
        totals.output += (u.output_tokens || 0);
    }

    async function connect() {
        try {
            const EPHEMERAL_KEY = await getRealtimeKey({ caseId, userId, aiModel, aiSide, behaviourParams, withAudio, voice });
            pc = new RTCPeerConnection();
            dc = pc.createDataChannel("oai-events");
            dc.onmessage = (e) => {
                try {
                    const evt = JSON.parse(e.data);
                    if (evt?.type === "response.done") {
                        if (evt?.response?.usage) {
                            addUsage(evt.response.usage);
                            onUsage && onUsage({ turn: evt.response.usage, totals: getTotals() });
                        }
                        if (onMessage && evt?.response?.output?.[0]?.content?.[0]?.text) {
                            onMessage(evt.response.output[0].content[0].text);
                        }
                    }
                } catch (err) {
                    onError && onError(err);
                }
            };
            dc.onerror = (e) => onError && onError(e);

            if (withAudio) {
                micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
                pc.addTrack(micStream.getAudioTracks()[0], micStream);
                pc.ontrack = (e) => {
                    const el = document.getElementById(audioElId);
                    if (el) {
                        el.srcObject = e.streams[0];
                        el.play?.().catch((er) => { console.error(er) });
                    }
                };
            } else {
                const silentTrack = createSilentAudioTrack();
                audioContext = silentTrack.audioContext;
                micStream = silentTrack.stream;
                pc.addTrack(micStream.getAudioTracks()[0], micStream);
                pc.ontrack = (e) => {
                    const el = document.getElementById(audioElId);
                    if (el) {
                        el.srcObject = e.streams[0];
                        if (withAudio) {
                            el.play?.().catch((er) => { console.error(er) });
                        }
                    }
                };
            }
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            const resp = await fetch(`https://api.openai.com/v1/realtime/calls?model=${encodeURIComponent(model)}`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${EPHEMERAL_KEY}`,
                    "Content-Type": "application/sdp",
                },
                body: offer.sdp,
            });
            const answerSDP = await resp.text();
            await pc.setRemoteDescription({ type: "answer", sdp: answerSDP });
            connected = true;
            onConnected && onConnected();
        } catch (err) {
            onError && onError(err);
            throw err;
        }
    }

    function sendText(text) {
        if (!connected || !dc) return;
        dc.send(JSON.stringify({
            type: "response.create",
            response: {
                input: [{ role: "user", content: [{ type: "input_text", text }] }]
            }
        }));
    }

    function endTurn() {
        if (!connected || !dc) return;
        dc.send(JSON.stringify({ type: "response.create", response: {} }));
    }

    function getTotals() {
        const textInputCost = (totals.textIn / 1000) * TOKEN_COSTS[model].text.input;
        const textOutputCost = (totals.textOut / 1000) * TOKEN_COSTS[model].text.output;
        const audioInputCost = (totals.audioIn / 1000) * TOKEN_COSTS[model].audio.input;
        const audioOutputCost = (totals.audioOut / 1000) * TOKEN_COSTS[model].audio.output;
        const totalCost = textInputCost + textOutputCost + audioInputCost + audioOutputCost;
        const result = {
            ...totals,
            costs: {
                textInput: textInputCost,
                textOutput: textOutputCost,
                audioInput: audioInputCost,
                audioOutput: audioOutputCost,
                total: totalCost
            },
            totalCost: getNiceNum(totalCost, 4),
        };
        return result;
    }

    async function close() {
        connected = false;
        try { dc && dc.close(); } catch { }
        try { pc && pc.close(); } catch { }
        try { micStream && micStream.getTracks().forEach(t => t.stop()); } catch { }
        try { audioContext && audioContext.close(); } catch { }
    }

    return { connect, sendText, endTurn, getTotals, close, isConnected: () => connected };
}
