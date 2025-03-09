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

// 应用AI建议的修改
function applyAISuggestions(modifications) {
    console.log('正在应用思维导图修改:', modifications);
    if (!selectedNode) {
        alert('请先选择一个节点');
        return;
    }
    
    // 构建修改历史记录
    let modificationLog = [];
    
    try {
        modifications.forEach(mod => {
            console.log(`处理修改: ${mod.action} - "${mod.topic}"`);
            
            switch (mod.action) {
                case '添加子节点':
                    const newNodeId = generateUniqueID();
                    jm.add_node(selectedNode, newNodeId, mod.topic);
                    modificationLog.push(`- 已添加子节点: "${mod.topic}"`);
                    break;
                    
                case '修改当前节点':
                    const oldTopic = selectedNode.topic;
                    jm.update_node(selectedNode.id, mod.topic);
                    modificationLog.push(`- 已将节点"${oldTopic}"修改为"${mod.topic}"`);
                    break;
                    
                case '添加兄弟节点':
                    if (selectedNode.parent) {
                        const siblingId = generateUniqueID();
                        jm.add_node(selectedNode.parent, siblingId, mod.topic);
                        modificationLog.push(`- 已添加兄弟节点: "${mod.topic}"`);
                    } else {
                        console.warn('无法添加兄弟节点：当前节点没有父节点');
                        modificationLog.push(`- 无法添加兄弟节点"${mod.topic}"：当前为根节点`);
                    }
                    break;
                    
                default:
                    console.warn('未知的修改操作:', mod.action);
                    modificationLog.push(`- 未知操作(${mod.action}): "${mod.topic}"`);
            }
        });
        
        // 显示修改结果
        addMessage('ai', `已应用以下修改:\n${modificationLog.join('\n')}`);
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
            console.log('首次AI查询，获取完整思维导图结构');
            const mindmapStructure = getMindmapStructure();
            
            // 构建包含完整结构的提示信息
            prompt = `您是一个思维导图助手。下面是当前思维导图的完整结构：\n\n`;
            prompt += `所有节点：\n`;
            mindmapStructure.allNodes.forEach(node => {
                prompt += `- ${node.topic} (ID: ${node.id}, ${node.isRoot ? '根节点' : `父节点ID: ${node.parentId}`})\n`;
            });
            
            prompt += `\n当前选中的节点是: ${mindmapStructure.selectedNode ? mindmapStructure.selectedNode.topic : '无'}\n\n`;
            prompt += `用户问题: "${query}"\n\n`;
            prompt += `请回答用户问题。如果需要修改思维导图，请用特定格式给出建议：\n`;
            prompt += `- 添加子节点: "节点内容"\n- 修改当前节点: "新节点内容"\n- 添加兄弟节点: "节点内容"\n`;
            prompt += `所有修改建议需要在回答后单独列出，便于用户选择是否应用。`;
            
            isFirstQuery = false;
        } else {
            // 后续查询，包含当前节点及其子节点信息
            const nodeTopic = selectedNode ? selectedNode.topic : "未选择节点";
            let childrenInfo = "";
            
            if (selectedNode && selectedNode.id) {
                childrenInfo = getChildrenInfo(selectedNode);
                if (childrenInfo) {
                    childrenInfo = `\n当前节点的子节点:\n${childrenInfo}`;
                }
            }
            
            prompt = `思维导图当前选中节点："${nodeTopic}"${childrenInfo}\n用户问题："${query}"\n\n`;
            prompt += `请回答用户问题。如果需要修改思维导图，请用特定格式给出建议：\n`;
            prompt += `- 添加子节点: "节点内容"\n- 修改当前节点: "新节点内容"\n- 添加兄弟节点: "节点内容"\n`;
            prompt += `所有修改建议需要在回答后单独列出，便于用户选择是否应用。`;
        }
        
        console.log('发送给AI的提示:', prompt);
        
        let response;
        if (aiService === 'openai') {
            response = await callOpenAI(apiKey, prompt, conversationHistory);
        } else {
            response = await callDeepseek(apiKey, prompt, conversationHistory);
        }
        
        if (response) {
            // 提取修改建议
            const modifications = extractSuggestions(response);
            
            if (modifications.length > 0) {
                // 有修改建议，分离建议和回答
                const textWithoutSuggestions = removeSuggestionsFromText(response);
                addMessage('ai', textWithoutSuggestions, modifications);
            } else {
                // 没有修改建议，直接显示回答
                addMessage('ai', response);
            }
        }
    } catch (error) {
        console.error('AI请求错误:', error);
        addMessage('ai', `抱歉，处理您的请求时出错: ${error.message}`);
    } finally {
        document.getElementById('loading').style.display = 'none';
    }
}

// 提取建议
function extractSuggestions(text) {
    console.log('从AI回复中提取建议...');
    const suggestions = [];
    
    // 匹配更明确的修改建议格式
    const suggestionPatterns = [
        /(?:^|\n)-\s*添加子节点[:：]\s*[""](.+?)[""](?:\n|$)/g,
        /(?:^|\n)-\s*修改当前节点[:：]\s*[""](.+?)[""](?:\n|$)/g,
        /(?:^|\n)-\s*添加兄弟节点[:：]\s*[""](.+?)[""](?:\n|$)/g
    ];
    
    const actionTypes = ['添加子节点', '修改当前节点', '添加兄弟节点'];
    
    // 遍历所有模式
    suggestionPatterns.forEach((pattern, index) => {
        let match;
        while ((match = pattern.exec(text)) !== null) {
            suggestions.push({
                action: actionTypes[index],
                topic: match[1].trim()
            });
        }
    });
    
    console.log('提取到的建议:', suggestions);
    return suggestions;
}

// 从文本中移除建议
function removeSuggestionsFromText(text) {
    return text.replace(/(?:^|\n)-\s*(?:添加子节点|修改当前节点|添加兄弟节点)[:：]\s*[""](.+?)[""](?:\n|$)/g, '\n');
}

// 调用OpenAI API
async function callOpenAI(apiKey, prompt, history = []) {
    console.log('调用OpenAI API，提供对话历史条数:', history.length);
    
    try {
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        };
        
        // 构建消息数组，包含历史和当前提示
        const messages = [
            { role: 'system', content: '您是思维导图AI助手，可以帮助用户扩展思维导图、回答问题并给出修改建议。' },
            ...history.slice(-MAX_CONTEXT_LENGTH * 2),
            { role: 'user', content: prompt }
        ];
        
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({
                model: 'gpt-3.5-turbo',
                messages: messages,
                temperature: 0.7
            })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error.message || 'OpenAI API调用失败');
        }
        
        const data = await response.json();
        return data.choices[0].message.content;
    } catch (error) {
        console.error('OpenAI API调用错误:', error);
        throw error;
    }
}

// 调用Deepseek API
async function callDeepseek(apiKey, prompt, history = []) {
    console.log('调用Deepseek API，提供对话历史条数:', history.length);
    
    try {
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        };
        
        // 构建消息数组
        const messages = [
            { role: 'system', content: '您是思维导图AI助手，可以帮助用户扩展思维导图、回答问题并给出修改建议。' },
            ...history.slice(-MAX_CONTEXT_LENGTH * 2),
            { role: 'user', content: prompt }
        ];
        
        const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({
                model: 'deepseek-chat',
                messages: messages,
                temperature: 0.7
            })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error.message || 'Deepseek API调用失败');
        }
        
        const data = await response.json();
        return data.choices[0].message.content;
    } catch (error) {
        console.error('Deepseek API调用错误:', error);
        throw error;
    }
}

// 获取子节点信息
function getChildrenInfo(node) {
    console.log('获取子节点信息...');
    
    if (!node) {
        console.warn('节点为空');
        return '';
    }
    
    try {
        // 获取子节点
        const children = node.children || [];
        
        if (!children.length) {
            return '此节点没有子节点';
        }
        
        let childrenText = children
            .filter(child => child && child.topic) // 确保子节点有效且有topic属性
            .map(child => `• ${child.topic || '未命名节点'}`)
            .join('\n');
            
        return childrenText.trim() || '无法获取子节点信息';
    } catch (error) {
        console.error('获取子节点信息失败:', error);
        return '';
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
