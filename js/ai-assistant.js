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
    
    // 绑定toggle_chat按钮 - 显示/隐藏AI助手
    document.getElementById('toggle_chat').addEventListener('click', function() {
        const appContainer = document.querySelector('.app-container');
        appContainer.classList.toggle('chat-hidden');
        
        // 更新按钮文本
        const buttonIcon = this.querySelector('i');
        const buttonText = this.querySelector('span');
        
        if (appContainer.classList.contains('chat-hidden')) {
            buttonText.textContent = '显示助手';
            if (buttonIcon) buttonIcon.className = 'fas fa-eye';
        } else {
            buttonText.textContent = 'AI 助手';
            if (buttonIcon) buttonIcon.className = 'fas fa-comments';
        }
        
        // 调整思维导图大小
        setTimeout(() => {
            if (jm && typeof jm.resize === 'function') {
                console.log('重新调整思维导图大小');
                
                // 强制重新计算画布尺寸
                try {
                    // 获取容器和工具栏
                    const container = document.getElementById('jsmind_container');
                    const zoomController = document.querySelector('.zoom-controller');
                    
                    if (!container) {
                        console.warn('找不到jsmind容器');
                        return;
                    }
                    
                    const isVisible = !appContainer.classList.contains('chat-hidden');
                    console.log('AI助手状态:', isVisible ? '显示' : '隐藏');
                    
                    // 调整思维导图容器宽度（新的平行布局结构不需要调整宽度）
                    
                    // 等待DOM更新完成后再计算画布尺寸
                    setTimeout(() => {
                        // 强制重新计算画布尺寸
                        const w = container.clientWidth;
                        const h = container.clientHeight;
                        console.log(`画布新尺寸(更新后): ${w}x${h}`);
                        
                        // 调整大小
                        jm.resize();
                        
                        // 应用新尺寸
                        if (jm.view && typeof jm.view.size === 'function') {
                            jm.view.size(w, h);
                            console.log('已应用新尺寸到画布');
                        }
                        
                        // 确保根节点始终居中显示，无论是否有选中节点
                        console.log('重新居中根节点');
                        if (jm.mind && jm.mind.root) {
                            // 首先确保根节点在视图中居中
                            jm.view.center_node(jm.mind.root);
                            console.log('根节点已居中');
                        }
                        
                        // 如果有选中节点，再居中到选中节点
                        if (selectedNode && typeof jm.view.center_node === 'function') {
                            jm.view.center_node(jm.get_node(selectedNode.id));
                            console.log('选中节点已居中');
                        }
                        
                        // 确保画布重新渲染以适应新宽度
                        if (jm.view && typeof jm.view.expand_size === 'function') {
                            jm.view.expand_size();
                            console.log('扩展画布大小以适应新宽度');
                        }
                        
                        // 刷新视图
                        if (jm.view && typeof jm.view.show === 'function') {
                            jm.view.show();
                            console.log('刷新思维导图视图');
                        }
                    }, 50); // 短暂延时等待DOM更新
                    
                } catch (error) {
                    console.error('调整画布大小失败:', error);
                }
            }
        }, 300); // 等待过渡动画完成
    });
    
    // 默认显示AI助手侧边栏
    const appContainer = document.querySelector('.app-container');
    
    // 更新按钮状态 - 显示状态的文本和图标
    const toggleButton = document.getElementById('toggle_chat');
    const buttonText = toggleButton.querySelector('span');
    const buttonIcon = toggleButton.querySelector('i');
    
    buttonText.textContent = 'AI 助手';
    if (buttonIcon) buttonIcon.className = 'fas fa-comments';
    
    // 调整UI元素初始状态
    const zoomController = document.querySelector('.zoom-controller');
    
    if (zoomController) {
        console.log('设置缩放控制器初始位置');
        zoomController.style.right = '420px'; // 调整为显示状态下的位置
    }
    
    // 调整思维导图大小以适应整个区域
    setTimeout(() => {
        if (jm && typeof jm.resize === 'function') {
            console.log('初始化时调整思维导图大小');
            
            // 强制重新计算画布尺寸
            try {
                // 获取容器
                const container = document.getElementById('jsmind_container');
                const zoomController = document.querySelector('.zoom-controller');
                
                if (!container) {
                    console.warn('找不到jsmind容器');
                    return;
                }
                
                console.log('初始化AI助手状态: 显示');
                
                // 设置缩放控制器初始位置
                if (zoomController) {
                    console.log('设置缩放控制器初始位置');
                    zoomController.style.right = '20px';
                }
                
                // 等待DOM更新完成后再计算画布尺寸
                setTimeout(() => {
                    // 强制重新计算画布尺寸
                    const w = container.clientWidth;
                    const h = container.clientHeight;
                    console.log(`初始画布尺寸(更新后): ${w}x${h}`);
                    
                    // 调整大小
                    jm.resize();
                    
                    // 应用新尺寸
                    if (jm.view && typeof jm.view.size === 'function') {
                        jm.view.size(w, h);
                        console.log('已应用初始尺寸到画布');
                    }
                    
                    // 确保视图居中
                    if (jm.mind && jm.mind.root) {
                        jm.view.center_node(jm.mind.root);
                        console.log('初始化时根节点已居中');
                    }
                    
                    // 确保画布重新渲染以适应新宽度
                    if (jm.view && typeof jm.view.expand_size === 'function') {
                        jm.view.expand_size();
                        console.log('初始化时扩展画布大小');
                    }
                    
                    // 刷新视图
                    if (jm.view && typeof jm.view.show === 'function') {
                        jm.view.show();
                        console.log('初始化时刷新思维导图视图');
                    }
                }, 50); // 短暂延时等待DOM更新
                
            } catch (error) {
                console.error('初始化时调整画布大小失败:', error);
            }
        }
    }, 500); // 等待界面完全加载
    
    console.log('聊天界面初始化完成 - AI助手默认显示');
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

// 应用AI建议到思维导图
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
        
        // 递归添加子节点的函数，并生成详细的修改日志
        const addChildrenNodes = (parentNodeId, children, indent = 2) => {
            if (!children || !Array.isArray(children) || children.length === 0) return [];
            
            const addedNodesLog = [];
            
            children.forEach((child, index) => {
                const childNodeId = generateUniqueID();
                console.log(`添加子节点: 父节点ID=${parentNodeId}, 新节点ID=${childNodeId}, 内容="${child.topic}"`);
                
                // 添加节点到思维导图
                jm.add_node(parentNodeId, childNodeId, child.topic);
                
                // 创建缩进
                const indentSpaces = ' '.repeat(indent);
                let childLog = `${indentSpaces}${index + 1}. "${child.topic}"`;
                
                // 如果有注释，添加到节点和日志
                if (child.note && typeof addNodeNote === 'function') {
                    addNodeNote(childNodeId, child.note);
                    const notePreview = child.note.length > 50 ? 
                        child.note.substring(0, 50) + '...' : 
                        child.note;
                    childLog += `\n${indentSpaces}   备注: "${notePreview}"`;
                }
                
                // 递归添加孙节点
                if (child.children && Array.isArray(child.children) && child.children.length > 0) {
                    const grandChildrenLogs = addChildrenNodes(childNodeId, child.children, indent + 2);
                    if (grandChildrenLogs.length > 0) {
                        childLog += `\n${indentSpaces}   子节点:`;
                        grandChildrenLogs.forEach(log => {
                            childLog += `\n${log}`;
                        });
                    }
                }
                
                addedNodesLog.push(childLog);
            });
            
            return addedNodesLog;
        };
        
        modifications.forEach((mod, index) => {
            console.log(`处理修改 #${index + 1}: ${mod.action} - "${mod.topic}"`);
            
            if (!mod.action || !mod.topic) {
                console.warn('跳过无效修改建议:', mod);
                return;
            }
            
            switch (mod.action) {
                case '添加子节点':
                    const newNodeId = generateUniqueID();
                    console.log(`添加子节点: 父节点ID=${nodeObj.id}, 新节点ID=${newNodeId}, 内容="${mod.topic}"`);
                    
                    // 添加主节点
                    jm.add_node(nodeObj.id, newNodeId, mod.topic);
                    let logMessage = `- 修改 #${index + 1}: 添加子节点 "${mod.topic}"`;
                    
                    // 如果有子节点，递归添加并记录详细信息
                    if (mod.children && Array.isArray(mod.children) && mod.children.length > 0) {
                        const childrenLogs = addChildrenNodes(newNodeId, mod.children);
                        if (childrenLogs.length > 0) {
                            logMessage += `\n  子节点:`;
                            childrenLogs.forEach(log => {
                                logMessage += `\n${log}`;
                            });
                        }
                    }
                    
                    // 如果有注释，添加到节点和日志
                    if (mod.note && typeof addNodeNote === 'function') {
                        addNodeNote(newNodeId, mod.note);
                        const notePreview = mod.note.length > 50 ? 
                            mod.note.substring(0, 50) + '...' : 
                            mod.note;
                        logMessage += `\n  备注: "${notePreview}"`;
                    }
                    
                    modificationLog.push(logMessage);
                    break;
                    
                case '修改当前节点':
                    const oldTopic = nodeObj.topic;
                    console.log(`修改节点: ID=${nodeObj.id}, 旧内容="${oldTopic}", 新内容="${mod.topic}"`);
                    jm.update_node(nodeObj.id, mod.topic);
                    modificationLog.push(`- 修改 #${index + 1}: 将节点"${oldTopic}"修改为"${mod.topic}"`);
                    break;
                    
                case '添加兄弟节点':
                    if (nodeObj.parent) {
                        const parentId = nodeObj.parent.id;
                        const siblingId = generateUniqueID();
                        console.log(`添加兄弟节点: 父节点ID=${parentId}, 新节点ID=${siblingId}, 内容="${mod.topic}"`);
                        
                        // 添加主兄弟节点
                        jm.add_node(parentId, siblingId, mod.topic);
                        let siblingLogMessage = `- 修改 #${index + 1}: 添加兄弟节点 "${mod.topic}"`;
                        
                        // 如果有子节点，递归添加并记录详细信息
                        if (mod.children && Array.isArray(mod.children) && mod.children.length > 0) {
                            const childrenLogs = addChildrenNodes(siblingId, mod.children);
                            if (childrenLogs.length > 0) {
                                siblingLogMessage += `\n  子节点:`;
                                childrenLogs.forEach(log => {
                                    siblingLogMessage += `\n${log}`;
                                });
                            }
                        }
                        
                        // 如果有注释，添加到节点和日志
                        if (mod.note && typeof addNodeNote === 'function') {
                            addNodeNote(siblingId, mod.note);
                            const notePreview = mod.note.length > 50 ? 
                                mod.note.substring(0, 50) + '...' : 
                                mod.note;
                            siblingLogMessage += `\n  备注: "${notePreview}"`;
                        }
                        
                        modificationLog.push(siblingLogMessage);
                    } else {
                        console.warn('无法添加兄弟节点：当前节点没有父节点');
                        modificationLog.push(`- 修改 #${index + 1}: 无法添加兄弟节点"${mod.topic}"，当前为根节点`);
                    }
                    break;
                
                case '添加注释':
                    // 为当前节点添加备注
                    if (typeof window.addNodeNote === 'function') {
                        console.log(`添加注释: 节点ID=${selectedNode.id}, 内容="${mod.topic}"`);
                        window.addNodeNote(selectedNode.id, mod.topic);
                        modificationLog.push(`- 修改 #${index + 1}: 为当前节点添加注释`);
                        console.log('已添加备注内容和标记');
                    } else {
                        console.warn('addNodeNote函数不可用，使用备选方法');
                        
                        // 备选方法
                        if (!selectedNode.data) {
                            selectedNode.data = {};
                        }
                        selectedNode.data.note = mod.topic;
                        
                        // 确保节点数据更新
                        jm.update_node(selectedNode.id, selectedNode.topic, selectedNode.data);
                        modificationLog.push(`- 修改 #${index + 1}: 为当前节点添加注释`);
                        
                        // 添加备注标记
                        if (typeof window.addNoteMarker === 'function') {
                            // 获取更新后的节点对象
                            const updatedNode = jm.get_node(selectedNode.id);
                            window.addNoteMarker(updatedNode);
                            console.log('已添加备注内容和标记');
                        } else {
                            console.warn('addNoteMarker函数不可用，无法添加备注标记');
                        }
                    }
                    break;
                    
                default:
                    console.warn('未知的修改操作:', mod.action);
                    modificationLog.push(`- 修改 #${index + 1}: 未知操作(${mod.action}) "${mod.topic}"`);
            }
        });
        
        // 更新关系线和注释标记
        if (typeof updateRelationLines === 'function') {
            updateRelationLines();
        }
        if (typeof renderAllNoteMarkers === 'function') {
            setTimeout(() => {
                renderAllNoteMarkers();
                console.log('已更新所有备注标记');
            }, 300);
        }
        
        // 选择最后处理的节点，确保视图居中
        jm.select_node(selectedNode.id);
        jm.expand_to_depth(3);
        
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
3. 仅当用户明确要求修改思维导图并且AI助手功能开启时，才提供思维导图修改建议

当用户请求修改思维导图时，你必须提供至少两层的节点结构（即子节点及其子节点），并为重要节点添加详细备注。请按以下格式提供修改建议：
[
  {"action": "添加子节点", "topic": "一级节点内容", "children": [
    {"topic": "二级节点1内容"},
    {"topic": "二级节点2内容", "children": [
      {"topic": "三级节点内容"}
    ]}
  ]},
  {"action": "修改当前节点", "topic": "新内容"},
  {"action": "添加兄弟节点", "topic": "节点内容", "children": [
    {"topic": "子节点内容"}
  ]},
  {"action": "添加注释", "topic": "详细的注释内容，必须包含多段文本，提供深入解释、背景知识、使用案例等。注释应当至少包含3-5个段落，确保信息全面且有深度。"}
]

如果用户没有请求修改思维导图，或者AI助手功能已关闭，就正常回答用户问题，不要提供上述JSON格式的修改建议。
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
                
                // 仅当AI助手开启时才处理修改建议
                if (aiAssistantEnabled) {
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
                } else {
                    console.log('AI助手已关闭，不提供修改建议');
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
            
            endpoint = `https://${resourceName}.openai.azure.com/openai/deployments/${deploymentName}/chat/completions?api-version=2023-05-15`;            // 确保apiKey只包含有效字符
            const cleanApiKey = String(apiKey).replace(/[^\x20-\x7E]/g, '');
            headers['api-key'] = cleanApiKey;
            
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
                
                // 仅当AI助手开启时才处理修改建议
                if (aiAssistantEnabled) {
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
                } else {
                    console.log('AI助手已关闭，不提供修改建议');
                }
            }
            
            // 显示响应
            addMessage('ai', content, modifications);
            
        } else if (aiService === 'deepseek') {
            endpoint = 'https://api.deepseek.com/v1/chat/completions';
            // 确保apiKey只包含有效字符
            const cleanApiKey = String(apiKey).replace(/[^\x20-\x7E]/g, '');
            headers['Authorization'] = `Bearer ${cleanApiKey}`;
            
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
                
                // 仅当AI助手开启时才处理修改建议
                if (aiAssistantEnabled) {
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
                } else {
                    console.log('AI助手已关闭，不提供修改建议');
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
    // 检查AI助手是否开启
    if (!aiAssistantEnabled) {
        addMessage('ai', '请先开启AI助手，才能使用思维导图修改功能。');
        console.log('AI助手已关闭，不允许修改思维导图');
        return;
    }
    
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
    const modificationPrompt = `请根据我的思维导图和当前选中的节点，提供详细的多层次修改建议。
我的上一个问题是: "${latestUserQuery}"

当前思维导图结构: ${getMindmapStructure()}

当前选中的节点是: "${selectedNode.topic}"

请以JSON格式提供修改建议，你必须创建多层次的节点结构，格式如下:
[
  {"action": "添加子节点", "topic": "一级节点内容", "children": [
    {"topic": "二级节点1内容"},
    {"topic": "二级节点2内容", "children": [
      {"topic": "三级节点内容"}
    ]}
  ]},
  {"action": "修改当前节点", "topic": "新内容"},
  {"action": "添加兄弟节点", "topic": "节点内容", "children": [
    {"topic": "子节点内容"}
  ]},
  {"action": "添加注释", "topic": "详细的注释内容，必须包含多段文本，提供深入解释、背景知识、使用案例等。注释应当至少包含3-5个段落，确保信息全面且有深度。"}
]

对于注释内容，请尽可能详细和专业，提供丰富的背景信息、解释和案例。
注释内容可以包含多个段落，可以适当排版。
请尽量提供丰富详细的内容，包括多级节点结构和详细的备注说明。
只回复上述JSON格式的修改建议，不要有其他文字说明。`;

    // 在界面上显示加载状态
    document.getElementById('loading').style.display = 'block';
    
    // 添加用户请求消息
    addMessage('user', '请根据我的需求和上下文内容修改思维导图');
    
    try {
        // 准备发送请求
        const aiService = document.getElementById('ai_service').value;
        let endpoint;
        let headers = {'Content-Type': 'application/json'};
        let messages = [];
        
        const systemPrompt = `你是一个专业的思维导图AI助手，专门帮助用户扩展和完善思维导图结构。
你需要根据用户提供的当前思维导图结构和选中的节点，生成有针对性的修改建议。
你必须创建多层次的节点结构，至少包含两层（子节点及其子节点），使思维导图更加丰富和详细。

特别重要的是，你应该为关键节点添加详细的备注信息，这些备注必须包含：
1. 概念的完整定义和解释
2. 理论背景和历史发展
3. 实际应用案例和示例
4. 相关公式和模型的说明（如适用）
5. 学术观点和争议（如适用）
6. 进阶学习资源

这些备注内容应当详尽且结构化，作为节点主题的补充材料，帮助用户深入理解概念。每个备注应当至少包含3-5段文本，确保信息全面且有深度。

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

// 处理AI返回的响应
function handleAIResponse(response, isModification) {
    try {
        // 获取AI回复的文本内容
        const responseText = response.choices ? response.choices[0].message.content : response.message.content;
        
        // 添加AI回复消息到聊天区域
        addMessage('assistant', responseText);
        
        // 如果是修改请求，尝试解析和应用修改建议
        if (isModification) {
            try {
                // 尝试从文本中提取JSON部分
                const jsonMatch = responseText.match(/\[\s*{.*}\s*\]/s);
                if (jsonMatch) {
                    const modifications = JSON.parse(jsonMatch[0]);
                    applyAISuggestions(modifications);
                } else {
                    console.error('无法从响应中提取JSON数据');
                }
            } catch (e) {
                console.error('处理修改建议时出错:', e);
                alert('无法应用修改建议: ' + e.message);
            }
        }
    } catch (e) {
        console.error('处理AI响应时出错:', e);
        alert('处理AI响应失败: ' + e.message);
    } finally {
        // 隐藏加载状态
        document.getElementById('loading').style.display = 'none';
    }
}

