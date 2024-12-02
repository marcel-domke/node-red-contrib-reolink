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

// Allow self signed certificate
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

module.exports = function(RED) {
    function ReolinkApiNode(config) {
        RED.nodes.createNode(this, config);

        const node = this;
        const ip = config.ip;
        const user = config.user;
        const pass = this.credentials.pass;

        let token = null;
        let tokenRenewInterval = null;
        let aiQueryInterval = null;

        // Function to request the token
        async function requestToken() {
            try {
                const response = await fetch(`https://${ip}/api.cgi?cmd=Login`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify([
                        {
                            cmd: "Login",
                            param: {
                                User: {
                                    Version: "0",
                                    userName: user,
                                    password: pass
                                }
                            }
                        }
                    ]),
                });
                const data = await response.json();
                if (data[0]?.value?.Token?.name) {
                    token = data[0].value.Token.name;
                    node.status({ fill: "green", shape: "dot", text: "Token received" });

                    // Clear previous interval and set up token renewal
                    if (tokenRenewInterval) clearInterval(tokenRenewInterval);
                    tokenRenewInterval = setInterval(requestToken, 30 * 60 * 1000); // Renew token every 30 minutes
                } else {
                    node.status({ fill: "red", shape: "ring", text: "Token error" });
                }
            } catch (error) {
                node.status({ fill: "red", shape: "ring", text: `Error: ${error.message}` });
            }
        }

        // Function to query AI states
        async function queryAiState() {
            if (!token) {
                node.status({ fill: "red", shape: "ring", text: "No token available" });
                return;
            }
            try {
                const response = await fetch(`https://${ip}/api.cgi?cmd=GetAiState&token=${token}`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" }
                });
                const data = await response.json();
                const aiStates = data[0]?.value;
                if (aiStates) {
                    node.send({
                        payload: {
                            ai: {
                                people: aiStates.people.alarm_state,
                                dog_cat: aiStates.dog_cat.alarm_state,
                                vehicle: aiStates.vehicle.alarm_state
                            }
                        }
                    });
                }
            } catch (error) {
                node.status({ fill: "red", shape: "ring", text: `Error: ${error.message}` });
            }
        }

        // Initialize node
        (async () => {
            await requestToken();

            if (aiQueryInterval) clearInterval(aiQueryInterval);
            aiQueryInterval = setInterval(queryAiState, 2 * 1000); // Query AI states every 2 seconds
        })();

        node.on("close", () => {
            token = null; 
            //Clear intervals
            if (tokenRenewInterval) clearInterval(tokenRenewInterval);
            if (aiQueryInterval) clearInterval(aiQueryInterval); 
        });
    }

    RED.nodes.registerType("reolink-api", ReolinkApiNode, {
        credentials: {
            pass: { type: "password" },
        },
    });
};
