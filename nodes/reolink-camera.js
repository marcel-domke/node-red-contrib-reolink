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
//process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

module.exports = function (RED) {
    function ReolinkCameraNode(config) {
        RED.nodes.createNode(this, config);

        const node = this;
        node.ip = config.ip;
        node.user = config.user;
        node.pass = config.pass;
        node.token = null;
        node.tokenRenewTimeout = null;
        node.connectionStatus = { fill: "yellow", shape: "ring", text: `Initializing...` };


        // Request the token
        async function requestToken() {
            try {
                const response = await fetch(`http://${node.ip}/api.cgi?cmd=Login`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify([
                        {
                            cmd: "Login",
                            param: {
                                User: {
                                    Version: "0",
                                    userName: node.user,
                                    password: node.pass
                                }
                            }
                        },
                    ]),
                });
                const data = await response.json();
                if (data[0]?.value?.Token?.name) {
                    node.token = data[0].value.Token.name;
                    node.connectionStatus = { fill: "green", shape: "dot", text: `Connected` };
                } else {
                    console.warn("Received invalid token");
                    console.warn(data);
                    node.connectionStatus = { fill: "red", shape: "ring", text: `Error: Received invalid token` };
                }
            } catch (error) {
                console.warn("Connection failed", error.message);
                node.connectionStatus = { fill: "red", shape: "ring", text: `Error: Connection failed` };
            }

            // Set timeout to renew token
            node.tokenRenewTimeout = setTimeout(requestToken, 30 * 60 * 1000);
        }

        // Fetch specific data
        async function queryCommand(command) {
            if (node.token) {
                try {
                    const response = await fetch(`http://${node.ip}/api.cgi?cmd=${command}&token=${node.token}`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                    });
                    const data = await response.json();
                    return data;
                } catch (error) {
                    console.warn(error.message);
                }
            }
        }
        node.queryCommand = queryCommand;

        requestToken();

        node.on("close", () => {
            node.token = null;
            // Clear intervals
            if (node.tokenRenewTimeout) {
                clearTimeout(node.tokenRenewTimeout);
            }
        });
    }

    // Register node
    RED.nodes.registerType("reolink-camera", ReolinkCameraNode);
};
