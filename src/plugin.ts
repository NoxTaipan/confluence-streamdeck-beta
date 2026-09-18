import streamDeck from "@elgato/streamdeck";
import { MultistreamTarget } from "./actions/multistream-target";
import { MainStream } from "./actions/main-stream";
import { StartAll } from "./actions/start-all";
import { StopAll } from "./actions/stop-all";
import { RestartConfluence } from "./actions/restart-confluence";
import { PushInfo } from "./actions/push-info";
import { ChatSend } from "./actions/chat-send";
import { StatusDial } from "./actions/status-dial";

streamDeck.logger.setLevel("info");

streamDeck.actions.registerAction(new MultistreamTarget());
streamDeck.actions.registerAction(new MainStream());
streamDeck.actions.registerAction(new StartAll());
streamDeck.actions.registerAction(new StopAll());
streamDeck.actions.registerAction(new RestartConfluence());
streamDeck.actions.registerAction(new PushInfo());
streamDeck.actions.registerAction(new ChatSend());
streamDeck.actions.registerAction(new StatusDial());

streamDeck.connect();
