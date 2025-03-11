// AI助手相关功能和聊天界面

// 注意：本文件依赖core.js中定义的全局变量:
// - conversationHistory
// - isFirstQuery
// - aiAssistantEnabled
// - selectedNode
// - jm

const MAX_CONTEXT_LENGTH = 10; // 最大上下文长度

// 初始化聊天界面
function initChat() {
    console.log('初始化聊天界面...');
    
    // 初始绑定发送按钮
    document.getElementById('send_button').addEventListener('click', sendMessage);
    
    // 绑定Enter键发送
    document.getElementById('chat_input').addEventListener('keypress', function(event) {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            sendMessage();
        }
    });
    
    // 绑定设置按钮
    document.getElementById('settings_toggle').addEventListener('click', function() {
        const settingsPanel = document.getElementById('api_settings');
        settingsPanel.classList.toggle('show');
    });
    
    // 绑定修改思维导图按钮
    document.getElementById('modify_mindmap').addEventListener('click', function() {
        console.log('用户请求修改思维导图');
        requestMindmapModification();
    });
    
    // 绑定AI服务类型切换
    document.getElementById('ai_service').addEventListener('change', function() {
        const azureSettings = document.querySelector('.azure-settings');
        if (this.value === 'azure' && azureSettings) {
            azureSettings.style.display = 'block';
        } else if (azureSettings) {
            azureSettings.style.display = 'none';
        }
    });
    
    // 绑定聊天输入框自动调整高度
    document.getElementById('chat_input').addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = (this.scrollHeight < 120) ? this.scrollHeight + 'px' : '120px';
    });
    
    // 绑定新建对话按钮
    document.getElementById('new_conversation').addEventListener('click', function() {
        console.log('开始新对话，清除历史记录');
        // 清空对话历史
        conversationHistory = [];
        isFirstQuery = true;
        
        // 清空聊天界面
        const chatMessages = document.getElementById('chat_messages');
        chatMessages.innerHTML = '';
        
        // 添加欢迎消息
        addMessage('ai', '您好！我是思维导图AI助手。选择一个节点并向我提问，我将帮助您扩展思维导图。');
    });
    
    // 绑定AI助手开关
    document.getElementById('ai_toggle').addEventListener('click', function() {
        toggleAIAssistant();
        this.textContent = aiAssistantEnabled ? '关闭AI助手' : '开启AI助手';
        this.style.backgroundColor = aiAssistantEnabled ? '#f44336' : '#4CAF50';
    });
    
    console.log('聊天界面初始化完成');
}

// 发送消息
function sendMessage() {
    const inputEl = document.getElementById('chat_input');
    const message = inputEl.value.trim();
    
    if (message) {
        console.log('用户发送消息:', message);
        
        // 添加用户消息到界面
        addMessage('user', message);
        
        // 添加到对话历史
        conversationHistory.push({role: 'user', content: message});
        // 保持对话历史不超过最大长度
        if (conversationHistory.length > MAX_CONTEXT_LENGTH * 2) {
            conversationHistory = conversationHistory.slice(-MAX_CONTEXT_LENGTH * 2);
            console.log(`对话历史超出限制，截取保留最新的${MAX_CONTEXT_LENGTH * 2}条记录`);
        }
        
        // 清空输入框
        inputEl.value = '';
        inputEl.style.height = 'auto';
        
        // 处理消息
        processAIRequest(message);
    }
}

// 添加消息到聊天区域
function addMessage(sender, text, modifications = null) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}-message`;
    
    // 处理普通文本内容
    const textContent = document.createElement('div');
    textContent.innerHTML = text.replace(/\n/g, '<br>');
    messageDiv.appendChild(textContent);
    
    // 如果有思维导图修改建议，添加类似代码编辑器的修改区域
    if (modifications && modifications.length > 0) {
        console.log('添加思维导图修改建议:', modifications);
        
        // 创建修改预览区域
        const modDiv = document.createElement('div');
        modDiv.className = 'mindmap-modification';
        
        // 格式化修改内容
        let modificationText = "思维导图修改建议:\n";
        modifications.forEach((mod, index) => {
            modificationText += `${index + 1}. ${mod.action}: "${mod.topic}"\n`;
        });
        
        modDiv.textContent = modificationText;
        
        // 添加控制按钮
        const controlsDiv = document.createElement('div');
        controlsDiv.className = 'modification-controls';
        
        // 应用按钮
        const applyButton = document.createElement('button');
        applyButton.className = 'apply-button';
        applyButton.textContent = '应用修改';
        applyButton.onclick = function() {
            applyAISuggestions(modifications);
        };
        
        // 拒绝按钮
        const rejectButton = document.createElement('button');
        rejectButton.className = 'reject-button';
        rejectButton.textContent = '拒绝修改';
        rejectButton.onclick = function() {
            addMessage('ai', '已拒绝应用修改建议。');
        };
        
        // 添加按钮到控制区
        controlsDiv.appendChild(rejectButton);
        controlsDiv.appendChild(applyButton);
        
        // 将修改区域和控制区添加到消息
        messageDiv.appendChild(modDiv);
        messageDiv.appendChild(controlsDiv);
    }
    
    document.getElementById('chat_messages').appendChild(messageDiv);
    
    // 滚动到底部
    const chatContainer = document.getElementById('chat_messages');
    chatContainer.scrollTop = chatContainer.scrollHeight;
    
    // 如果是AI消息，添加到对话历史
    if (sender === 'ai') {
        conversationHistory.push({
            role: 'assistant', 
            content: text + (modifications ? '\n修改建议: ' + JSON.stringify(modifications) : '')
        });
    }
}

// 获取思维导图结构
function getMindmapStructure() {
    console.log('获取思维导图结构...');
    
    if (!jm || !jm.mind) {
        console.warn('思维导图实例未初始化');
        return '';
    }
    
    try {
        const data = jm.get_data();
        return JSON.stringify(data);
    } catch (error) {
        console.error('获取思维导图结构失败:', error);
        return '';
    }
}

// 获取节点的路径
function getNodePath(node) {
    const path = [];
    let current = node;
    
    while (current) {
        if (current.topic) {
            path.unshift(current.topic);
        }
        current = current.parent;
    }
    
    return path;
}

// 修改思维导图节点
function applyAISuggestions(modifications) {
    console.log('正在应用思维导图修改:', modifications);
    if (!selectedNode) {
        alert('请先选择一个节点');
        return;
    }
    
    // 构建修改历史记录
    let modificationLog = [];
    
    try {
        // 确保有效的节点ID
        if (!selectedNode.id || typeof selectedNode.id !== 'string') {
            console.error('选中节点没有有效ID:', selectedNode);
            throw new Error('选中节点没有有效ID');
        }
        
        // 获取节点对象，确保它存在于jsMind中
        const nodeObj = jm.get_node(selectedNode.id);
        if (!nodeObj) {
            console.error('无法在jsMind中找到节点:', selectedNode.id);
            throw new Error(`无法找到节点: ${selectedNode.id}`);
        }
        
        console.log('成功找到节点:', {id: nodeObj.id, topic: nodeObj.topic});
        
        modifications.forEach(mod => {
            console.log(`处理修改: ${mod.action} - "${mod.topic}"`);
            
            switch (mod.action) {
                case '添加子节点':
                    const newNodeId = generateUniqueID();
                    console.log(`添加子节点: 父节点ID=${nodeObj.id}, 新节点ID=${newNodeId}, 内容="${mod.topic}"`);
                    jm.add_node(nodeObj.id, newNodeId, mod.topic);
                    modificationLog.push(`- 已添加子节点: "${mod.topic}"`);
                    break;
                    
                case '修改当前节点':
                    const oldTopic = nodeObj.topic;
                    console.log(`修改节点: ID=${nodeObj.id}, 旧内容="${oldTopic}", 新内容="${mod.topic}"`);
                    jm.update_node(nodeObj.id, mod.topic);
                    modificationLog.push(`- 已将节点"${oldTopic}"修改为"${mod.topic}"`);
                    break;
                    
                case '添加兄弟节点':
                    if (nodeObj.parent) {
                        const parentId = nodeObj.parent.id;
                        const siblingId = generateUniqueID();
                        console.log(`添加兄弟节点: 父节点ID=${parentId}, 新节点ID=${siblingId}, 内容="${mod.topic}"`);
                        jm.add_node(parentId, siblingId, mod.topic);
                        modificationLog.push(`- 已添加兄弟节点: "${mod.topic}"`);
                    } else {
                        console.warn('无法添加兄弟节点：当前节点没有父节点');
                        modificationLog.push(`- 无法添加兄弟节点"${mod.topic}"：当前为根节点`);
                    }
                    break;
                
                case '添加注释':
                    // 如果有添加注释的操作，调用addNodeNote
                    if (typeof addNodeNote === 'function') {
                        console.log(`添加注释: 节点ID=${nodeObj.id}, 内容="${mod.topic}"`);
                        addNodeNote(nodeObj.id, mod.topic);
                        modificationLog.push(`- 已添加注释: "${mod.topic}"`);
                    } else {
                        console.warn('添加注释功能不可用');
                        modificationLog.push(`- 无法添加注释: 功能不可用`);
                    }
                    break;
                    
                default:
                    console.warn('未知的修改操作:', mod.action);
                    modificationLog.push(`- 未知操作(${mod.action}): "${mod.topic}"`);
            }
        });
        
        // 显示修改结果
        addMessage('ai', `已应用以下修改:\n${modificationLog.join('\n')}`);
        
        // 更新关系线和注释标记
        if (typeof updateRelationLines === 'function') {
            updateRelationLines();
        }
        if (typeof renderAllNoteMarkers === 'function') {
            renderAllNoteMarkers();
        }
    } catch (error) {
        console.error('应用修改失败:', error);
        addMessage('ai', `应用修改时出错: ${error.message}`);
    }
}

// 处理AI请求
async function processAIRequest(query) {
    const aiService = document.getElementById('ai_service').value;
    const apiKey = document.getElementById('api_key').value;
    
    if (!apiKey) {
        addMessage('ai', '请先点击设置，输入API密钥。');
        document.getElementById('api_settings').classList.add('show');
        return;
    }
    
    try {
        document.getElementById('loading').style.display = 'block';
        
        let prompt = '';
        
        // 首次查询，获取完整思维导图结构
        if (isFirstQuery) {
            console.log('首次查询，添加思维导图结构信息');
            prompt = `请协助我处理这个思维导图。思维导图结构如下：\n${getMindmapStructure()}\n\n`;
            
            // 如果有选中的节点，添加节点信息
            if (selectedNode) {
                prompt += `当前选中的节点是: "${selectedNode.topic}"\n`;
                
                // 添加节点的路径信息
                const path = getNodePath(selectedNode);
                if (path.length > 0) {
                    prompt += `节点路径: ${path.join(' > ')}\n`;
                }
                
                // 添加子节点信息
                if (selectedNode.children && selectedNode.children.length > 0) {
                    prompt += `子节点: ${selectedNode.children.map(child => `"${child.topic}"`).join(', ')}\n`;
                }
            }
            
            prompt += `\n我的问题是: ${query}\n`;
            isFirstQuery = false;
        } else {
            // 后续对话，直接传递用户问题
            prompt = query;
            
            // 如果是新选中了节点，额外添加当前节点的信息
            if (selectedNode && selectedNode.topic) {
                prompt = `当前我选中了节点"${selectedNode.topic}"。\n${query}`;
            }
        }
        
        console.log('发送到AI的提示:', prompt);
        
        // 创建请求数据
        let endpoint;
        let headers = {'Content-Type': 'application/json'};
        let messages = [];
        
        // 构建系统指令
        const systemPrompt = `你是一个强大的思维导图助手，既能帮助用户扩展和完善他们的思维导图，也能提供正常的对话回应和知识解答。

在与用户的对话中，你可以：
1. 回答用户关于任何主题的问题，提供信息和知识
2. 参与正常的对话交流
3. 根据用户请求对思维导图进行修改

当用户请求修改思维导图时，请提供具体的修改建议，格式如下：
[
  {"action": "添加子节点", "topic": "节点内容"},
  {"action": "修改当前节点", "topic": "新内容"},
  {"action": "添加兄弟节点", "topic": "节点内容"},
  {"action": "添加注释", "topic": "注释内容"}
]

如果用户没有请求修改思维导图，就正常回答用户问题，不需要提供上述JSON格式的修改建议。
`;
        
        // 根据不同的AI服务调整请求格式
        if (aiService === 'openai') {
            endpoint = 'https://api.openai.com/v1/chat/completions';
            
            messages = [
                { role: 'system', content: systemPrompt },
                ...conversationHistory
            ];
            
            const requestData = {
                endpoint: endpoint,
                apiKey: apiKey,
                model: 'gpt-3.5-turbo',
                messages: messages,
                temperature: 0.7,
                max_tokens: 2000
            };
            
            console.log('发送OpenAI请求...');
            const data = await window.openaiApi.createCompletion(requestData);
            console.log('API响应:', data);
            
            // 处理响应
            let content = '';
            let modifications = null;
            
            if (data.choices && data.choices[0] && data.choices[0].message) {
                content = data.choices[0].message.content;
                
                // 尝试解析修改建议
                try {
                    // 查找JSON格式的修改建议
                    const jsonMatch = content.match(/\[\s*{.*}\s*\]/s);
                    if (jsonMatch) {
                        // 提取JSON字符串
                        const jsonStr = jsonMatch[0];
                        // 尝试解析
                        modifications = JSON.parse(jsonStr);
                        console.log('检测到修改建议:', modifications);
                        
                        // 从内容中移除JSON
                        content = content.replace(jsonStr, '修改建议已解析（见下方按钮）');
                    }
                } catch (error) {
                    console.warn('解析修改建议失败:', error);
                }
            }
            
            // 显示响应
            addMessage('ai', content, modifications);
            
        } else if (aiService === 'azure') {
            // 获取Azure设置
            const resourceName = document.getElementById('resource_name').value;
            const deploymentName = document.getElementById('deployment_name').value || 'gpt-35-turbo';
            
            if (!resourceName) {
                throw new Error('使用Azure服务需要填写资源名称');
            }
            
            endpoint = `https://${resourceName}.openai.azure.com/openai/deployments/${deploymentName}/chat/completions?api-version=2023-05-15`;
            headers['api-key'] = apiKey;
            
            messages = [
                { role: 'system', content: systemPrompt },
                ...conversationHistory
            ];
            
            const requestData = {
                endpoint: endpoint,
                headers: headers,
                messages: messages,
                temperature: 0.7,
                max_tokens: 2000
            };
            
            console.log('发送Azure请求...');
            const data = await window.openaiApi.createCompletion(requestData);
            console.log('API响应:', data);
            
            // 处理响应
            let content = '';
            let modifications = null;
            
            if (data.choices && data.choices[0] && data.choices[0].message) {
                content = data.choices[0].message.content;
                
                // 尝试解析修改建议
                try {
                    // 查找JSON格式的修改建议
                    const jsonMatch = content.match(/\[\s*{.*}\s*\]/s);
                    if (jsonMatch) {
                        // 提取JSON字符串
                        const jsonStr = jsonMatch[0];
                        // 尝试解析
                        modifications = JSON.parse(jsonStr);
                        console.log('检测到修改建议:', modifications);
                        
                        // 从内容中移除JSON
                        content = content.replace(jsonStr, '修改建议已解析（见下方按钮）');
                    }
                } catch (error) {
                    console.warn('解析修改建议失败:', error);
                }
            }
            
            // 显示响应
            addMessage('ai', content, modifications);
            
        } else if (aiService === 'deepseek') {
            endpoint = 'https://api.deepseek.com/v1/chat/completions';
            headers['Authorization'] = `Bearer ${apiKey}`;
            
            messages = [
                { role: 'system', content: systemPrompt },
                ...conversationHistory
            ];
            
            const requestData = {
                endpoint: endpoint,
                headers: headers,
                model: 'deepseek-chat',
                messages: messages,
                temperature: 0.7,
                max_tokens: 2000
            };
            
            console.log('发送Deepseek请求...');
            const data = await window.openaiApi.createCompletion(requestData);
            console.log('API响应:', data);
            
            // 处理响应
            let content = '';
            let modifications = null;
            
            if (data.choices && data.choices[0] && data.choices[0].message) {
                content = data.choices[0].message.content;
                
                // 尝试解析修改建议
                try {
                    // 查找JSON格式的修改建议
                    const jsonMatch = content.match(/\[\s*{.*}\s*\]/s);
                    if (jsonMatch) {
                        // 提取JSON字符串
                        const jsonStr = jsonMatch[0];
                        // 尝试解析
                        modifications = JSON.parse(jsonStr);
                        console.log('检测到修改建议:', modifications);
                        
                        // 从内容中移除JSON
                        content = content.replace(jsonStr, '修改建议已解析（见下方按钮）');
                    }
                } catch (error) {
                    console.warn('解析修改建议失败:', error);
                }
            }
            
            // 显示响应
            addMessage('ai', content, modifications);
            
        } else {
            throw new Error('不支持的AI服务');
        }
        
    } catch (error) {
        console.error('AI请求错误:', error);
        addMessage('ai', `发生错误: ${error.message}`);
    } finally {
        document.getElementById('loading').style.display = 'none';
    }
}

// 切换AI助手
function toggleAIAssistant() {
    aiAssistantEnabled = !aiAssistantEnabled;
    console.log('AI助手状态切换为:', aiAssistantEnabled ? '开启' : '关闭');
    
    // 更新按钮样式
    const toggleButton = document.getElementById('ai_toggle');
    if (toggleButton) {
        toggleButton.textContent = aiAssistantEnabled ? '关闭AI助手' : '开启AI助手';
        toggleButton.style.backgroundColor = aiAssistantEnabled ? '#f44336' : '#4CAF50';
    }
    
    // 显示状态变更消息
    addMessage('ai', aiAssistantEnabled ? 
        'AI助手已开启，将自动响应您选择的节点。' : 
        'AI助手已关闭，只会响应您的直接提问。');
}

// 发送思维导图修改请求
async function requestMindmapModification() {
    // 检查是否有选中的节点
    if (!selectedNode) {
        addMessage('ai', '请先选择一个节点，然后再请求修改思维导图。');
        return;
    }
    
    // 验证选中节点的有效性
    if (!selectedNode.id || typeof selectedNode.id !== 'string') {
        addMessage('ai', '选中的节点无效，请重新选择一个节点。');
        console.error('选中节点无效:', selectedNode);
        return;
    }
    
    // 验证节点在jsMind中是否存在
    const nodeInMind = jm.get_node(selectedNode.id);
    if (!nodeInMind) {
        addMessage('ai', '选中的节点在思维导图中不存在，请重新选择一个节点。');
        console.error('节点不存在于jsMind中:', selectedNode.id);
        return;
    }
    
    // 检查API密钥是否存在
    const apiKey = document.getElementById('api_key').value;
    if (!apiKey) {
        addMessage('ai', '请先点击设置，输入API密钥。');
        document.getElementById('api_settings').classList.add('show');
        return;
    }
    
    // 获取当前对话的最后一条用户消息作为上下文
    let latestUserQuery = "请帮我扩展当前选中的节点";
    if (conversationHistory.length > 0) {
        for (let i = conversationHistory.length - 1; i >= 0; i--) {
            if (conversationHistory[i].role === 'user') {
                latestUserQuery = conversationHistory[i].content;
                break;
            }
        }
    }
    
    // 构建特定的提示词，要求AI生成思维导图修改建议
    const modificationPrompt = `请根据我的思维导图和当前选中的节点，提供具体的修改建议。
我的上一个问题是: "${latestUserQuery}"

当前思维导图结构: ${getMindmapStructure()}

当前选中的节点是: "${selectedNode.topic}"

请以JSON格式提供修改建议，格式如下:
[
  {"action": "添加子节点", "topic": "节点内容"},
  {"action": "修改当前节点", "topic": "新内容"},
  {"action": "添加兄弟节点", "topic": "节点内容"},
  {"action": "添加注释", "topic": "注释内容"}
]

只回复上述JSON格式的修改建议，不要有其他文字说明。`;

    // 在界面上显示加载状态
    document.getElementById('loading').style.display = 'block';
    
    // 添加用户请求消息
    addMessage('user', '请帮我修改当前选中的节点及其结构');
    
    try {
        // 准备发送请求
        const aiService = document.getElementById('ai_service').value;
        let endpoint;
        let headers = {'Content-Type': 'application/json'};
        let messages = [];
        
        const systemPrompt = `你是一个专业的思维导图AI助手，专门帮助用户扩展和完善思维导图结构。
你需要根据用户提供的当前思维导图结构和选中的节点，生成有针对性的修改建议。
修改建议必须以严格的JSON格式返回，不要有任何其他文字说明。`;
        
        if (aiService === 'openai') {
            endpoint = 'https://api.openai.com/v1/chat/completions';
            
            messages = [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: modificationPrompt }
            ];
            
            const requestData = {
                endpoint: endpoint,
                apiKey: apiKey,
                model: 'gpt-3.5-turbo',
                messages: messages,
                temperature: 0.7,
                max_tokens: 2000
            };
            
            console.log('发送OpenAI修改请求...');
            const data = await window.openaiApi.createCompletion(requestData);
            console.log('修改请求响应:', data);
            
            // 处理响应
            if (data.choices && data.choices[0] && data.choices[0].message) {
                const content = data.choices[0].message.content;
                
                // 尝试解析JSON格式的修改建议
                try {
                    // 提取JSON
                    const trimmedContent = content.trim();
                    const jsonStart = trimmedContent.indexOf('[');
                    const jsonEnd = trimmedContent.lastIndexOf(']') + 1;
                    
                    if (jsonStart >= 0 && jsonEnd > jsonStart) {
                        const jsonStr = trimmedContent.substring(jsonStart, jsonEnd);
                        const modifications = JSON.parse(jsonStr);
                        
                        console.log('成功解析修改建议:', modifications);
                        
                        // 显示AI回复和修改建议
                        addMessage('ai', '以下是我的修改建议:', modifications);
                    } else {
                        throw new Error('返回内容中未找到有效的JSON格式');
                    }
                } catch (error) {
                    console.error('解析修改建议失败:', error);
                    addMessage('ai', `无法解析修改建议: ${content}`);
                }
            }
        } else if (aiService === 'deepseek') {
            endpoint = 'https://api.deepseek.com/v1/chat/completions';
            headers['Authorization'] = `Bearer ${apiKey}`;
            
            messages = [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: modificationPrompt }
            ];
            
            const requestData = {
                endpoint: endpoint,
                headers: headers,
                model: 'deepseek-chat',
                messages: messages,
                temperature: 0.7,
                max_tokens: 2000
            };
            
            console.log('发送Deepseek修改请求...');
            const data = await window.openaiApi.createCompletion(requestData);
            console.log('修改请求响应:', data);
            
            // 处理响应
            if (data.choices && data.choices[0] && data.choices[0].message) {
                const content = data.choices[0].message.content;
                
                // 尝试解析JSON格式的修改建议
                try {
                    // 提取JSON
                    const trimmedContent = content.trim();
                    const jsonStart = trimmedContent.indexOf('[');
                    const jsonEnd = trimmedContent.lastIndexOf(']') + 1;
                    
                    if (jsonStart >= 0 && jsonEnd > jsonStart) {
                        const jsonStr = trimmedContent.substring(jsonStart, jsonEnd);
                        const modifications = JSON.parse(jsonStr);
                        
                        console.log('成功解析修改建议:', modifications);
                        
                        // 显示AI回复和修改建议
                        addMessage('ai', '以下是我的修改建议:', modifications);
                    } else {
                        throw new Error('返回内容中未找到有效的JSON格式');
                    }
                } catch (error) {
                    console.error('解析修改建议失败:', error);
                    addMessage('ai', `无法解析修改建议: ${content}`);
                }
            }
        } else if (aiService === 'azure') {
            // Azure实现暂时保留原样
            addMessage('ai', `暂不支持使用 ${aiService} 服务进行思维导图修改。请切换到OpenAI或Deepseek服务。`);
        } else {
            throw new Error('不支持的AI服务');
        }
    } catch (error) {
        console.error('修改请求错误:', error);
        addMessage('ai', `发生错误: ${error.message}`);
    } finally {
        document.getElementById('loading').style.display = 'none';
    }
}

// 生成唯一ID
function generateUniqueID() {
    return 'node_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
}
