/*
Copyright 2025 Marcel Domke

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
    function ReolinkPtzPresetNode(config) {
        RED.nodes.createNode(this, config);

        const node = this;
        const server = RED.nodes.getNode(config.server);
        node.updateTimeout = null;
        node.ready = false;

        // Update status
        async function updateStatus() {
            try {
                if (server.ability[0].value.Ability.abilityChn[0].ptzPreset.ver == 1) {
                    node.status(server.connectionStatus);
                    node.ready = true;
                }
                else {
                    node.status({ fill: "red", shape: "ring", text: `Unsupported` });
                }
            } catch (error) {
                node.status({ fill: "red", shape: "ring", text: `Error: Config Node` });
            }

            // Set timeout to call updateStatus again
            node.updateTimeout = setTimeout(updateStatus, 3000);
        }

        node.on('input', async function (msg) {
            if (Number.isInteger(msg.payload) && node.ready == true) {
                if (msg.payload < 64 && msg.payload >= 0) {
                    try {
                        requestBody = JSON.stringify([
                            {
                                "cmd": "PtzCtrl",
                                "param": {
                                    "channel": 0,
                                    "op": "ToPos",
                                    "id": msg.payload
                                }
                            },
                        ]);
                        await server.queryCommand("PtzCtrl", requestBody);
                    } catch (error) {
                        console.warn("Error during query: ", error.message);
                        node.status({ fill: "red", shape: "ring", text: `Error: Send failed` });
                    }
                }
            }
            else if (node.ready == true){
                try {
                    requestBody = JSON.stringify([
                        {
                            "cmd": "GetPtzPreset",
                            "action": 1,
                            "param": {
                                "channel": 0
                            }
                        },
                    ]);
                    const data = await server.queryCommand("GetPtzPreset", requestBody);
                    if (data) {
                        node.send({ 
                            payload: data[0].value.PtzPreset,
                            topic: config.topic || server.name 
                        });
                    }
                } catch (error) {
                    console.warn("Error during query: ", error.message);
                    node.status({ fill: "red", shape: "ring", text: `Error: Send failed` });
                }
            }
        });

        // Start first update
        updateStatus();

        node.on("close", () => {
            if (node.updateTimeout) {
                clearTimeout(node.updateTimeout);
            }
        });
    }

    RED.nodes.registerType("reolink-ptz-preset", ReolinkPtzPresetNode);
};
