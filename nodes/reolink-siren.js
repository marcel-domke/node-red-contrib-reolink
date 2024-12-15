/*
Copyright 2024 Marcel Domke

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

module.exports = function (RED) {
    function ReolinkSirenNode(config) {
        RED.nodes.createNode(this, config);

        const node = this;
        const server = RED.nodes.getNode(config.server);
        node.queryTimeout = null;
        node.lastState = null;

        // Fetch data and send to output
        async function queryStates() {
            try {
                if (server.token != null) {
                    if (server.ability[0].value.Ability.scheduleVersion.ver == 1) {
                        const data = await server.queryCommand("GetAudioAlarmV20");
                        if (data) {
                            sirenState = data[0].value.Audio.enable;
                            if (sirenState != node.lastState) {
                                node.send({
                                    payload: (sirenState == 1 ? true : false)
                                });
                                node.lastState = sirenState;
                                node.status({
                                    fill: server.connectionStatus.fill,
                                    shape: server.connectionStatus.shape,
                                    text: server.connectionStatus.text + " | " + (sirenState == 1 ? "On" : "Off")
                                });
                            }
                        }
                    }
                    else {
                        node.status({ fill: "red", shape: "ring", text: `Unsupported` });
                    }
                }
                else {
                    node.status(server.connectionStatus);
                }
            }
            catch (error) {
                console.warn("Error during query: ", error.message);
                node.status({ fill: "red", shape: "ring", text: `Error: Query failed` });
            }

            // Set timeout to call queryStates again
            node.queryTimeout = setTimeout(queryStates, 3000);
        }

        // Start first query
        queryStates();

        node.on('input', async function (msg) {
            try {
                if (server.ability[0].value.Ability.scheduleVersion.ver == 1 && (msg.payload == true || msg.payload == false)) {
                    requestBody = JSON.stringify([
                        {
                            "cmd": "SetAudioAlarmV20",
                            "param": {
                                "Audio": {
                                    "enable": msg.payload == true ? 1 : 0
                                }
                            }
                        },
                    ]);
                    await server.queryCommand("SetAudioAlarmV20", requestBody);
                }
            } catch (error) {
                console.warn("Error during query: ", error.message);
                node.status({ fill: "red", shape: "ring", text: `Error: Send failed` });
            }
        });

        node.on("close", () => {
            if (node.queryTimeout) {
                clearTimeout(node.queryTimeout);
            }
        });
    }

    RED.nodes.registerType("reolink-siren", ReolinkSirenNode);
};
