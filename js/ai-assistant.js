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
    
    // 确保aiAssistantEnabled变量已初始化（默认为关闭状态）
    if (typeof aiAssistantEnabled === 'undefined') {
        window.aiAssistantEnabled = false;
        console.log('AI助手初始状态设置为: 关闭');
    }
    
    // 初始化AI助手按钮状态
    const aiToggleBtn = document.getElementById('ai_toggle');
    if (aiToggleBtn) {
        // 设置初始class
        aiToggleBtn.classList.toggle('ai-enabled', aiAssistantEnabled);
        
        // 设置初始文本
        updateAiToggleButtonText();
    }
    
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
    document.getElementById('modify_mindmap_chat').addEventListener('click', function() {
        console.log('用户请求修改思维导图');
        requestMindmapModification();
    });
    
    // 绑定扩展内容按钮
    document.getElementById('expand_content').addEventListener('click', function() {
        console.log('用户请求扩展内容');
        requestContentExpansion();
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
        const welcomeMessages = {
            zh: '您好！我是思维导图AI助手。选择一个节点并向我提问，我将帮助您扩展思维导图。',
            en: 'Hello! I am the Mind Map AI Assistant. Select a node and ask me questions, I will help you expand your mind map.'
        };
        const currentLang = window.i18n ? window.i18n.getCurrentLang() : 'zh';
        addMessage('ai', welcomeMessages[currentLang] || welcomeMessages.zh);
    });
    
    // 绑定AI助手开关
    document.getElementById('ai_toggle').addEventListener('click', function() {
        toggleAIAssistant();
    });
    
    // 绑定toggle_chat按钮 - 显示/隐藏AI助手
    document.getElementById('toggle_chat').addEventListener('click', function() {
        const chatContainer = document.querySelector('.chat-container');
        if (chatContainer) {
            chatContainer.classList.toggle('show');
            
            // 改变按钮图标和文本
            const toggleButton = document.getElementById('toggle_chat');
            if (toggleButton) {
                const isVisible = chatContainer.classList.contains('show');
                toggleButton.querySelector('i').className = isVisible ? 'fas fa-times' : 'fas fa-comments';
                if (toggleButton.querySelector('span')) {
                    toggleButton.querySelector('span').textContent = isVisible ? '关闭助手' : 'AI助手';
                }
            }
        }
    });
    
    // 监听语言变化事件，更新界面文本
    document.addEventListener('languageChanged', () => {
        updateChatInterfaceLanguage();
    });
    
    // 初始化时设置界面语言
    updateChatInterfaceLanguage();
    
    // 绑定toggle_chat按钮 - 显示/隐藏AI助手的替代实现
    const toggleChatBtn = document.getElementById('toggle_chat');
    if (toggleChatBtn && !toggleChatBtn._hasAlternateListener) {
        toggleChatBtn._hasAlternateListener = true;
        
        toggleChatBtn.addEventListener('click', function() {
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
                            if (selectedNode && typeof jm.view.center_node === 'function' && selectedNode.id) {
                                const nodeToCenter = jm.get_node(selectedNode.id);
                                if (nodeToCenter) {
                                    jm.view.center_node(nodeToCenter);
                                    console.log('选中节点已居中');
                                }
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
    }
    
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
                    
                    // 如果有选中节点，再居中到选中节点
                    if (selectedNode && typeof jm.view.center_node === 'function' && selectedNode.id) {
                        const nodeToCenter = jm.get_node(selectedNode.id);
                        if (nodeToCenter) {
                            jm.view.center_node(nodeToCenter);
                            console.log('选中节点已居中');
                        }
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

// 更新聊天界面语言
function updateChatInterfaceLanguage() {
    // 确保aiAssistantEnabled已定义
    if (typeof aiAssistantEnabled === 'undefined') {
        window.aiAssistantEnabled = false;
    }
    
    const currentLang = window.i18n ? window.i18n.getCurrentLang() : 'zh';
    
    // 如果对话历史为空，重新添加欢迎消息
    if (!conversationHistory || conversationHistory.length === 0) {
        const chatMessages = document.getElementById('chat_messages');
        if (chatMessages) {
            chatMessages.innerHTML = '';
            
            const welcomeMessages = {
                zh: '您好！我是思维导图AI助手。选择一个节点并向我提问，我将帮助您扩展思维导图。',
                en: 'Hello! I am the Mind Map AI Assistant. Select a node and ask me questions, I will help you expand your mind map.'
            };
            addMessage('ai', welcomeMessages[currentLang] || welcomeMessages.zh);
        }
    }
    
    // 更新AI助手开关按钮文本
    updateAiToggleButtonText();
}

// 更新AI助手开关按钮文本
function updateAiToggleButtonText() {
    const aiToggleBtn = document.getElementById('ai_toggle');
    if (aiToggleBtn) {
        const textSpan = aiToggleBtn.querySelector('span');
        if (textSpan) {
            const key = aiAssistantEnabled ? 'ai_mode_edit' : 'ai_mode_chat';
            textSpan.textContent = window.i18n.t(key);
            textSpan.setAttribute('data-i18n', key);
        }
    }
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

// 为JSON添加语法高亮
function formatJsonWithHighlight(jsonText) {
    // 替换键、字符串值、数字、布尔值和null
    return jsonText
        .replace(/"([^"]+)":/g, '<span class="json-key">"$1"</span>:') // 键
        .replace(/: "([^"]*)"/g, ': <span class="json-string">"$1"</span>') // 字符串值
        .replace(/: (-?\d+(\.\d+)?)/g, ': <span class="json-number">$1</span>') // 数字
        .replace(/: (true|false)/g, ': <span class="json-boolean">$1</span>') // 布尔值
        .replace(/: null/g, ': <span class="json-null">null</span>'); // null
}

// 添加消息到聊天区域
function addMessage(sender, text, modifications = null) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}-message`;
    
    // 处理普通文本内容
    const textContent = document.createElement('div');
    
    // 检测文本中是否包含JSON结构
    const containsJson = (text && text.includes('[') && text.includes(']') && 
                         (text.includes('"action":') || text.includes('"topic":')));
    
    let extractedModifications = null;
    
    if (containsJson) {
        // 尝试格式化JSON部分
        try {
            // 查找可能的JSON部分
            const jsonMatch = text.match(/\[\s*{.*}\s*\]/s);
            if (jsonMatch) {
                // 将非JSON部分和JSON部分分开处理
                const beforeJson = text.substring(0, text.indexOf(jsonMatch[0]));
                const jsonPart = jsonMatch[0];
                const afterJson = text.substring(text.indexOf(jsonMatch[0]) + jsonMatch[0].length);
                
                // 非JSON部分正常处理
                if (beforeJson) {
                    const beforeDiv = document.createElement('div');
                    beforeDiv.innerHTML = beforeJson.replace(/\n/g, '<br>');
                    textContent.appendChild(beforeDiv);
                }
                
                // 尝试解析JSON以提取修改建议，但不显示JSON内容
                try {
                    // 尝试解析JSON
                    const parsedJson = JSON.parse(jsonPart);
                    
                    // 如果modifications未传入但JSON解析成功，尝试使用此JSON作为modifications
                    if (Array.isArray(parsedJson) && parsedJson.length > 0 && 
                        parsedJson[0].action && parsedJson[0].topic) {
                        console.log('从消息文本中提取modifications:', parsedJson);
                        extractedModifications = parsedJson;
                    }
                } catch (e) {
                    console.warn('JSON解析失败:', e);
                }
                
                // 非JSON部分正常处理
                if (afterJson) {
                    const afterDiv = document.createElement('div');
                    afterDiv.innerHTML = afterJson.replace(/\n/g, '<br>');
                    textContent.appendChild(afterDiv);
                }
            } else {
                // 没找到JSON结构，正常处理
                textContent.innerHTML = text.replace(/\n/g, '<br>');
            }
        } catch (e) {
            console.warn('JSON格式化失败:', e);
            // 失败时回退到普通文本处理
            textContent.innerHTML = text.replace(/\n/g, '<br>');
        }
    } else {
        // 普通文本正常处理
        textContent.innerHTML = text.replace(/\n/g, '<br>');
    }
    
    messageDiv.appendChild(textContent);
    
    // 尝试使用传入的modifications，如果没有则使用从文本中提取的
    const modToUse = modifications || extractedModifications;
    
    // 如果有思维导图修改建议，添加类似代码编辑器的修改区域
    if (modToUse && Array.isArray(modToUse) && modToUse.length > 0) {
        console.log('添加思维导图修改建议:', modToUse);
        
        // 创建修改预览区域
        const modDiv = document.createElement('div');
        modDiv.className = 'mindmap-modification';
        
        // 格式化修改内容
        let modificationText = "思维导图修改建议:\n";
        modToUse.forEach((mod, index) => {
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
            applyAISuggestions(modToUse);
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
            content: text + (modToUse ? '\n修改建议: ' + JSON.stringify(modToUse) : '')
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
    // 调用独立模块中的函数
    return window.mindmapModifier.applyAISuggestions(modifications);
}

// 处理AI请求
async function processAIRequest(query) {
    const aiService = document.getElementById('ai_service').value;
    const apiKey = document.getElementById('api_key').value;
    
    if (!apiKey) {
        addMessage('ai', window.i18n.t('api_settings_prompt'));
        document.getElementById('api_settings').classList.add('show');
        return;
    }
    
    try {
        document.getElementById('loading').style.display = 'block';
        
        let prompt = '';
        const currentLang = window.i18n ? window.i18n.getCurrentLang() : 'zh';
        
        // 首次查询，获取完整思维导图结构
        if (isFirstQuery) {
            console.log('首次查询，添加思维导图结构信息');
            
            // 中英文提示词模板
            const promptTemplates = {
                zh: {
                    intro: `请协助我处理这个思维导图。思维导图结构如下：\n${getMindmapStructure()}\n\n`,
                    selectedNode: `当前选中的节点是: "{NODE_TOPIC}"\n`,
                    path: `节点路径: {PATH}\n`,
                    children: `子节点: {CHILDREN}\n`,
                    question: `\n我的问题是: {QUERY}\n`
                },
                en: {
                    intro: `Please help me with this mind map. The mind map structure is as follows:\n${getMindmapStructure()}\n\n`,
                    selectedNode: `Currently selected node: "{NODE_TOPIC}"\n`,
                    path: `Node path: {PATH}\n`,
                    children: `Child nodes: {CHILDREN}\n`,
                    question: `\nMy question is: {QUERY}\n`
                }
            };
            
            // 获取当前语言的模板
            const template = promptTemplates[currentLang] || promptTemplates.zh;
            
            // 构建提示词
            prompt = template.intro;
            
            // 如果没有选中节点，则使用根节点
            if (!selectedNode && jm && jm.mind && jm.mind.root) {
                console.log('未选中节点，使用根节点');
                selectedNode = jm.mind.root;
            }
            
            // 如果有选中的节点，添加节点信息
            if (selectedNode) {
                prompt += template.selectedNode.replace('{NODE_TOPIC}', selectedNode.topic);
                
                // 添加节点的路径信息
                const path = getNodePath(selectedNode);
                if (path.length > 0) {
                    prompt += template.path.replace('{PATH}', path.join(' > '));
                }
                
                // 添加子节点信息
                if (selectedNode.children && selectedNode.children.length > 0) {
                    prompt += template.children.replace(
                        '{CHILDREN}', 
                        selectedNode.children.map(child => `"${child.topic}"`).join(', ')
                    );
                }
            } else {
                console.log('未能找到有效节点');
                prompt += currentLang === 'en' ? 
                    'No node is currently selected.\n' : 
                    '当前没有选中任何节点。\n';
            }
            
            prompt += template.question.replace('{QUERY}', query);
            isFirstQuery = false;
        } else {
            // 后续对话，直接传递用户问题
            prompt = query;
            
            // 如果没有选中节点，则使用根节点
            if (!selectedNode && jm && jm.mind && jm.mind.root) {
                console.log('未选中节点，使用根节点');
                selectedNode = jm.mind.root;
            }
            
            // 如果是新选中了节点，额外添加当前节点的信息
            if (selectedNode && selectedNode.topic) {
                if (currentLang === 'en') {
                    prompt = `I have selected the node "${selectedNode.topic}".\n${query}`;
                } else {
                    prompt = `当前我选中了节点"${selectedNode.topic}"。\n${query}`;
                }
            }
        }
        
        console.log('发送到AI的提示:', prompt);
        
        // 创建请求数据
        let endpoint;
        let headers = {'Content-Type': 'application/json'};
        let messages = [];
        
        // 构建系统指令
        const systemPrompts = {
            zh: `你是一个强大的思维导图助手，既能帮助用户扩展和完善他们的思维导图，也能提供正常的对话回应和知识解答。

在与用户的对话中，你有两种模式：
1. 普通对话模式：回答用户问题，提供信息和知识
2. 思维导图修改模式：提供修改建议的文字说明和JSON格式的具体修改指令

【重要】只有当用户明确点击了"修改思维导图"按钮时，你才应该进入思维导图修改模式。在普通聊天中，即使用户询问关于思维导图的内容，也请用普通文本回答，不要输出JSON格式。

对每个重要节点添加详细注释是非常重要的。注释能提供深层次信息、背景知识、使用场景和扩展阅读，大大增强思维导图的价值。请确保为每个关键节点添加内容丰富的注释。

当进入思维导图修改模式时：
1. 首先提供一段文字，简要概述你的修改建议
2. 然后提供JSON格式的详细修改指令，包含至少两层的节点结构（即子节点及其子节点），并为重要节点添加详细备注。

JSON格式要求如下：
[
  {"action": "添加子节点", "topic": "一级节点内容", "children": [
    {"topic": "二级节点1内容", "note": "（可选）对二级节点1的详细说明和补充信息"},
    {"topic": "二级节点2内容", "children": [
      {"topic": "三级节点内容", "note": "（可选）对三级节点的详细说明"}
    ]}
  ]},
  {"action": "修改当前节点", "topic": "新内容"},
  {"action": "添加兄弟节点", "topic": "节点内容", "children": [
    {"topic": "子节点内容", "note": "（可选）子节点的补充信息"}
  ]},
  {"action": "添加注释", "topic": "详细的注释内容，必须包含多段文本，提供深入解释、背景知识、使用案例等。注释应当至少包含3-5个段落，确保信息全面且有深度。"}
]

确保在思维导图修改模式中先提供文字概述，再提供JSON格式的具体修改指令。在普通对话模式中只使用正常文本回复。
`,

            en: `You are a powerful mind map assistant who can both help users expand and refine their mind maps, as well as provide normal conversational responses and knowledge.

In your dialogue with users, you operate in two modes:
1. Normal conversation mode: Answer questions, provide information and knowledge
2. Mind map modification mode: Provide a text overview of your suggestions, followed by JSON-formatted specific modification instructions

【IMPORTANT】Only when the user explicitly clicks the "Modify Mind Map" button should you enter mind map modification mode. In normal chat, even if the user asks about mind maps, please answer with normal text, not with JSON format.

【NOTE IMPORTANCE】Adding detailed notes to each major node is extremely important. Notes provide deeper information, background knowledge, use cases and extended reading, greatly enhancing the value of the mind map. Please ensure that every key node has rich, informative notes.

When in mind map modification mode:
1. First provide a text paragraph that briefly summarizes your modification suggestions
2. Then provide JSON-formatted detailed modification instructions, including at least two layers of node structure (i.e., child nodes and their child nodes), and add detailed notes for important nodes.

IMPORTANT: Even in English conversations, you must use the exact Chinese action names in your JSON responses as shown below:
[
  {"action": "添加子节点", "topic": "First-level node content", "children": [
    {"topic": "Second-level node 1 content", "note": "Detailed explanation and supplementary information for second-level node 1"},
    {"topic": "Second-level node 2 content", "children": [
      {"topic": "Third-level node content", "note": "Detailed explanation for the third-level node"}
    ]}
  ]},
  {"action": "修改当前节点", "topic": "New content"},
  {"action": "添加兄弟节点", "topic": "Node content", "children": [
    {"topic": "Child node content", "note": "Supplementary information for the child node"}
  ]},
  {"action": "添加注释", "topic": "Detailed note content that must include multiple paragraphs, providing in-depth explanations, background knowledge, use cases, etc. The note should contain at least 3-5 paragraphs to ensure comprehensive and in-depth information."}
]

The action names MUST be in Chinese exactly as shown above: "添加子节点", "修改当前节点", "添加兄弟节点", "添加注释". 
The content can be in English, but the action names must be in Chinese.

Ensure that in mind map modification mode, you first provide a text overview, then the JSON-formatted specific instructions. In conversation mode, use only normal text responses.
`
        };
        
        // 根据不同的AI服务调整请求格式
        if (aiService === 'openai') {
            endpoint = 'https://api.openai.com/v1/chat/completions';
            
            messages = [
                { role: 'system', content: systemPrompts[currentLang] },
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
            if (data.choices && data.choices[0] && data.choices[0].message) {
                const content = data.choices[0].message.content;
                
                // 检查是否是通过"修改思维导图"按钮发起的请求
                const isModificationRequest = conversationHistory.some(msg => 
                    msg.role === 'user' && 
                    (msg.content.includes('请根据我的需求和上下文内容修改思维导图') || 
                     msg.content.includes('Please modify the mind map based on my needs and context'))
                );
                
                // 仅当AI助手开启并且是修改请求时才尝试解析JSON
                if (aiAssistantEnabled && isModificationRequest) {
                    // 使用新模块解析修改建议
                    const parseResult = parseAIResponseJSON(content);
                    
                    if (parseResult.success && parseResult.modifications) {
                        addMessage('ai', content, parseResult.modifications);
                    } else {
                        console.error('解析修改建议失败:', parseResult.error);
                        addMessage('ai', `无法解析修改建议，AI返回的内容可能不是有效的JSON格式。以下是原始响应:\n\n${content}`);
                    }
                } else {
                    console.log('非思维导图修改请求或AI助手未启用，不尝试提取JSON');
                    // 普通对话响应，直接显示
                    addMessage('ai', content);
                }
            }
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
                { role: 'system', content: systemPrompts[currentLang] },
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
            if (data.choices && data.choices[0] && data.choices[0].message) {
                const content = data.choices[0].message.content;
                
                // 检查是否是通过"修改思维导图"按钮发起的请求
                const isModificationRequest = conversationHistory.some(msg => 
                    msg.role === 'user' && 
                    (msg.content.includes('请根据我的需求和上下文内容修改思维导图') || 
                     msg.content.includes('Please modify the mind map based on my needs and context'))
                );
                
                // 仅当AI助手开启并且是修改请求时才尝试解析JSON
                if (aiAssistantEnabled && isModificationRequest) {
                    // 使用新模块解析修改建议
                    const parseResult = parseAIResponseJSON(content);
                    
                    if (parseResult.success && parseResult.modifications) {
                        addMessage('ai', content, parseResult.modifications);
                    } else {
                        console.error('解析修改建议失败:', parseResult.error);
                        addMessage('ai', `无法解析修改建议，AI返回的内容可能不是有效的JSON格式。以下是原始响应:\n\n${content}`);
                    }
                } else {
                    console.log('非思维导图修改请求，不尝试提取JSON');
                    // 普通对话响应，直接显示
                    addMessage('ai', content);
                }
            }
            
        } else if (aiService === 'deepseek') {
            endpoint = 'https://api.deepseek.com/v1/chat/completions';
            headers['Authorization'] = `Bearer ${apiKey}`;
            
            messages = [
                { role: 'system', content: systemPrompts[currentLang] },
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
            if (data.choices && data.choices[0] && data.choices[0].message) {
                const content = data.choices[0].message.content;
                
                // 检查是否是通过"修改思维导图"按钮发起的请求
                const isModificationRequest = conversationHistory.some(msg => 
                    msg.role === 'user' && 
                    (msg.content.includes('请根据我的需求和上下文内容修改思维导图') || 
                     msg.content.includes('Please modify the mind map based on my needs and context'))
                );
                
                if (isModificationRequest) {
                    // 使用新模块解析修改建议
                    const parseResult = parseAIResponseJSON(content);
                    
                    if (parseResult.success && parseResult.modifications) {
                        addMessage('ai', content, parseResult.modifications);
                    } else {
                        console.error('解析修改建议失败:', parseResult.error);
                        addMessage('ai', `无法解析修改建议，AI返回的内容可能不是有效的JSON格式。以下是原始响应:\n\n${content}`);
                    }
                } else {
                    // 普通对话模式，直接添加消息
                    addMessage('ai', content);
                    console.log('非思维导图修改请求，不尝试提取JSON');
                }
            } else {
                throw new Error('AI响应缺少必要数据');
            }
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
    
    // 更新按钮样式 - 只更新文本和class，不直接设置颜色
    const toggleButton = document.getElementById('ai_toggle');
    if (toggleButton) {
        // 使用class标记状态而不是直接设置颜色
        toggleButton.classList.toggle('ai-enabled', aiAssistantEnabled);
        
        // 更新按钮文本
        updateAiToggleButtonText();
    }
    
    // 显示状态变更消息
    const statusMessages = {
        zh: {
            enabled: '当前为编辑模式，将自动响应您选择的节点。',
            disabled: '当前为对话模式，将只响应您的直接提问。'
        },
        en: {
            enabled: 'Currently in edit mode, will automatically respond to your selected nodes.',
            disabled: 'Currently in conversation mode, will only respond to your direct questions.'
        }
    };
    
    const currentLang = window.i18n ? window.i18n.getCurrentLang() : 'zh';
    const messageKey = aiAssistantEnabled ? 'enabled' : 'disabled';
    
    addMessage('ai', statusMessages[currentLang][messageKey] || statusMessages.zh[messageKey]);
}

// 发送思维导图修改请求
async function requestMindmapModification() {
    // 检查AI助手是否开启
    if (!aiAssistantEnabled) {
        addMessage('ai', window.i18n.t('enable_ai_first'));
        console.log('当前为对话模式，不允许修改思维导图');
        return;
    }
    
    // 如果没有选中节点，尝试使用根节点
    if (!selectedNode && jm && jm.mind && jm.mind.root) {
        console.log('未选中节点，使用根节点');
        selectedNode = jm.mind.root;
    }
    
    // 检查是否有选中的节点
    if (!selectedNode) {
        addMessage('ai', window.i18n.t('select_node_for_modify'));
        return;
    }
    
    // 验证选中节点的有效性
    if (!selectedNode.id || typeof selectedNode.id !== 'string') {
        addMessage('ai', window.i18n.t('invalid_node_id'));
        console.error('选中节点无效:', selectedNode);
        return;
    }
    
    // 验证节点在jsMind中是否存在
    const nodeInMind = jm.get_node(selectedNode.id);
    if (!nodeInMind) {
        addMessage('ai', window.i18n.t('node_not_found', selectedNode.id));
        console.error('节点不存在于jsMind中:', selectedNode.id);
        return;
    }
    
    // 检查API密钥是否存在
    const apiKey = document.getElementById('api_key').value;
    if (!apiKey) {
        addMessage('ai', window.i18n.t('api_settings_prompt'));
        document.getElementById('api_settings').classList.add('show');
        return;
    }
    
    // 获取当前对话的最后一条用户消息作为上下文
    const currentLang = window.i18n ? window.i18n.getCurrentLang() : 'zh';
    let latestUserQuery = currentLang === 'en' ? 
        "Please help me expand the currently selected node" : 
        "请帮我扩展当前选中的节点";
        
    if (conversationHistory.length > 0) {
        for (let i = conversationHistory.length - 1; i >= 0; i--) {
            if (conversationHistory[i].role === 'user') {
                latestUserQuery = conversationHistory[i].content;
                break;
            }
        }
    }
    
    // 构建特定的提示词，要求AI生成思维导图修改建议
    // 中英文提示词模板
    const modificationPrompts = {
        zh: `【思维导图修改模式】请根据我的思维导图和当前选中的节点，提供详细的多层次修改建议。
我的上一个问题是: "${latestUserQuery}"

当前思维导图结构: ${getMindmapStructure()}

当前选中的节点是: "${selectedNode ? selectedNode.topic : '根节点'}"

请先用文字简要概述你的修改建议，说明你将如何扩展或改进当前思维导图。
然后在文字概述后面，提供JSON格式的详细修改指令。

JSON格式要求如下:
[
  {"action": "添加子节点", "topic": "一级节点内容", "children": [
    {"topic": "二级节点1内容", "note": "（可选）对二级节点1的详细说明和补充信息"},
    {"topic": "二级节点2内容", "children": [
      {"topic": "三级节点内容", "note": "（可选）对三级节点的详细说明"}
    ]}
  ]},
  {"action": "修改当前节点", "topic": "新内容"},
  {"action": "添加兄弟节点", "topic": "节点内容", "children": [
    {"topic": "子节点内容", "note": "（可选）子节点的补充信息"}
  ]},
  {"action": "添加注释", "topic": "详细的注释内容，必须包含多段文本，提供深入解释、背景知识、使用案例等。注释应当至少包含3-5个段落，确保信息全面且有深度。"}
]

对于注释内容，请尽可能详细和专业，提供丰富的背景信息、解释和案例。
注释内容可以包含多个段落，可以适当排版。
请尽量提供丰富详细的内容，包括多级节点结构和详细的备注说明。

重要：请首先提供文字概述，然后再提供JSON格式数据。`,

        en: `【MIND MAP MODIFICATION MODE】Based on my mind map and the currently selected node, please provide detailed multi-level modification suggestions.
My last question was: "${latestUserQuery}"

Current mind map structure: ${getMindmapStructure()}

Currently selected node: "${selectedNode ? selectedNode.topic : 'Root node'}"

First, please provide a brief text overview of your modification suggestions, explaining how you will expand or improve the current mind map.
Then after the text overview, provide the detailed modification instructions in JSON format.

The JSON format requirements are as follows:
[
  {"action": "添加子节点", "topic": "First-level node content", "children": [
    {"topic": "Second-level node 1 content", "note": "(optional)Detailed explanation and supplementary information for second-level node 1"},
    {"topic": "Second-level node 2 content", "children": [
      {"topic": "Third-level node content", "note": "(optional)Detailed explanation for the third-level node"}
    ]}
  ]},
  {"action": "修改当前节点", "topic": "New content"},
  {"action": "添加兄弟节点", "topic": "Node content", "children": [
    {"topic": "Child node content", "note": "(optional)Supplementary information for the child node"}
  ]},
  {"action": "添加注释", "topic": "Detailed note content that must include multiple paragraphs, providing in-depth explanations, background knowledge, use cases, etc. The note should contain at least 3-5 paragraphs to ensure comprehensive and in-depth information."}
]

For the note content, please be as detailed and professional as possible, providing rich background information, explanations, and examples.
Note content can include multiple paragraphs with appropriate formatting.
Please provide rich and detailed content, including multi-level node structures and detailed notes.

Important: Please first provide a text overview, then the JSON format data.`
    };
    
    const modificationPrompt = modificationPrompts[currentLang] || modificationPrompts.zh;

    // 在界面上显示加载状态
    document.getElementById('loading').style.display = 'block';
    
    // 添加用户请求消息
    const userRequestMessage = currentLang === 'en' ? 
        'Please modify the mind map based on my needs and context' : 
        '请根据我的需求和上下文内容修改思维导图';
    addMessage('user', userRequestMessage);
    
    try {
        // 准备发送请求
        const aiService = document.getElementById('ai_service').value;
        let endpoint;
        let headers = {'Content-Type': 'application/json'};
        let messages = [];
        
        const systemPrompts = {
            zh: `你是一个强大的思维导图助手，既能帮助用户扩展和完善他们的思维导图，也能提供正常的对话回应和知识解答。

在与用户的对话中，你有两种模式：
1. 普通对话模式：回答用户问题，提供信息和知识
2. 思维导图修改模式：提供修改建议的文字说明和JSON格式的具体修改指令

【重要】只有当用户明确点击了"修改思维导图"按钮时，你才应该进入思维导图修改模式。在普通聊天中，即使用户询问关于思维导图的内容，也请用普通文本回答，不要输出JSON格式。

对每个主要节点添加详细注释是非常重要的。注释能提供深层次信息、背景知识、使用场景和扩展阅读，大大增强思维导图的价值。请确保为每个关键节点添加内容丰富的注释。

当进入思维导图修改模式时：
1. 首先提供一段文字，简要概述你的修改建议
2. 然后提供JSON格式的详细修改指令，包含至少两层的节点结构（即子节点及其子节点），并为重要节点添加详细备注。

JSON格式要求如下：
[
  {"action": "添加子节点", "topic": "一级节点内容", "children": [
    {"topic": "二级节点1内容", "note": "（可选）对二级节点1的详细说明和补充信息"},
    {"topic": "二级节点2内容", "children": [
      {"topic": "三级节点内容", "note": "（可选）对三级节点的详细说明"}
    ]}
  ]},
  {"action": "修改当前节点", "topic": "新内容"},
  {"action": "添加兄弟节点", "topic": "节点内容", "children": [
    {"topic": "子节点内容", "note": "（可选）子节点的补充信息"}
  ]},
  {"action": "添加注释", "topic": "详细的注释内容，必须包含多段文本，提供深入解释、背景知识、使用案例等。注释应当至少包含3-5个段落，确保信息全面且有深度。"}
]

确保在思维导图修改模式中先提供文字概述，再提供JSON格式的具体修改指令。在普通对话模式中只使用正常文本回复。
`,

            en: `You are a powerful mind map assistant who can both help users expand and refine their mind maps, as well as provide normal conversational responses and knowledge.

In your dialogue with users, you operate in two modes:
1. Normal conversation mode: Answer questions, provide information and knowledge
2. Mind map modification mode: Provide a text overview of your suggestions, followed by JSON-formatted specific modification instructions

【IMPORTANT】Only when the user explicitly clicks the "Modify Mind Map" button should you enter mind map modification mode. In normal chat, even if the user asks about mind maps, please answer with normal text, not with JSON format.

Adding detailed notes to each major node is extremely important. Notes provide deeper information, background knowledge, use cases and extended reading, greatly enhancing the value of the mind map. Please ensure that every key node has rich, informative notes.

When in mind map modification mode:
1. First provide a text paragraph that briefly summarizes your modification suggestions
2. Then provide JSON-formatted detailed modification instructions, including at least two layers of node structure (i.e., child nodes and their child nodes), and add detailed notes for important nodes.

IMPORTANT: Even in English conversations, you must use the exact Chinese action names in your JSON responses as shown below:
[
  {"action": "添加子节点", "topic": "First-level node content", "children": [
    {"topic": "Second-level node 1 content", "note": "(optional)Detailed explanation and supplementary information for second-level node 1"},
    {"topic": "Second-level node 2 content", "children": [
      {"topic": "Third-level node content", "note": "(optional)Detailed explanation for the third-level node"}
    ]}
  ]},
  {"action": "修改当前节点", "topic": "New content"},
  {"action": "添加兄弟节点", "topic": "Node content", "children": [
    {"topic": "Child node content", "note": "(optional)Supplementary information for the child node"}
  ]},
  {"action": "添加注释", "topic": "Detailed note content that must include multiple paragraphs, providing in-depth explanations, background knowledge, use cases, etc. The note should contain at least 3-5 paragraphs to ensure comprehensive and in-depth information."}
]

The action names MUST be in Chinese exactly as shown above: "添加子节点", "修改当前节点", "添加兄弟节点", "添加注释". 
The content can be in English, but the action names must be in Chinese.

Ensure that in mind map modification mode, you first provide a text overview, then the JSON-formatted specific instructions. In conversation mode, use only normal text responses.
`
        };
        
        if (aiService === 'openai') {
            endpoint = 'https://api.openai.com/v1/chat/completions';
            
            messages = [
                { role: 'system', content: systemPrompts[currentLang] },
                { role: 'user', content: modificationPrompt }
            ];
            
            const requestData = {
                endpoint: endpoint,
                apiKey: apiKey,
                model: 'gpt-4o',
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
                
                // 检查是否是通过"修改思维导图"按钮发起的请求
                const isModificationRequest = conversationHistory.some(msg => 
                    msg.role === 'user' && 
                    (msg.content.includes('请根据我的需求和上下文内容修改思维导图') || 
                     msg.content.includes('Please modify the mind map based on my needs and context'))
                );
                
                if (isModificationRequest) {
                    // 使用新模块解析修改建议
                    const parseResult = parseAIResponseJSON(content);
                    
                    if (parseResult.success && parseResult.modifications) {
                        addMessage('ai', content, parseResult.modifications);
                    } else {
                        console.error('解析修改建议失败:', parseResult.error);
                        addMessage('ai', `无法解析修改建议，AI返回的内容可能不是有效的JSON格式。以下是原始响应:\n\n${content}`);
                    }
                } else {
                    // 普通对话模式，直接添加消息
                    addMessage('ai', content);
                    console.log('非思维导图修改请求，不尝试提取JSON');
                }
            } else {
                throw new Error('AI响应缺少必要数据');
            }
        } else if (aiService === 'deepseek') {
            endpoint = 'https://api.deepseek.com/v1/chat/completions';
            headers['Authorization'] = `Bearer ${apiKey}`;
            
            messages = [
                { role: 'system', content: systemPrompts[currentLang] },
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
                
                // 检查是否是通过"修改思维导图"按钮发起的请求
                const isModificationRequest = conversationHistory.some(msg => 
                    msg.role === 'user' && 
                    (msg.content.includes('请根据我的需求和上下文内容修改思维导图') || 
                     msg.content.includes('Please modify the mind map based on my needs and context'))
                );
                
                if (isModificationRequest) {
                    // 使用新模块解析修改建议
                    const parseResult = parseAIResponseJSON(content);
                    
                    if (parseResult.success && parseResult.modifications) {
                        addMessage('ai', content, parseResult.modifications);
                    } else {
                        console.error('解析修改建议失败:', parseResult.error);
                        addMessage('ai', `无法解析修改建议，AI返回的内容可能不是有效的JSON格式。以下是原始响应:\n\n${content}`);
                    }
                } else {
                    // 普通对话模式，直接添加消息
                    addMessage('ai', content);
                    console.log('非思维导图修改请求，不尝试提取JSON');
                }
            } else {
                throw new Error('AI响应缺少必要数据');
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
    // 调用独立模块中的函数
    return window.mindmapModifier.generateUniqueID();
}

// 处理AI返回的响应
function handleAIResponse(response, isModification) {
    console.log('开始处理AI响应:', { response, isModification });
    try {
        // 获取AI回复的文本内容
        const responseText = response.choices ? response.choices[0].message.content : response.message.content;
        console.log('解析得到响应文本:', responseText);
        
        // 添加AI回复消息到聊天区域
        addMessage('assistant', responseText);
        
        // 如果是修改请求，尝试解析和应用修改建议
        if (isModification) {
            console.log('处理思维导图修改请求');
            try {
                // 尝试从文本中提取JSON部分
                const jsonMatch = responseText.match(/\[\s*{.*}\s*\]/s);
                if (jsonMatch) {
                    console.log('从响应中提取到JSON部分:', jsonMatch[0]);
                    try {
                        const modifications = JSON.parse(jsonMatch[0]);
                        console.log('成功解析修改建议JSON:', modifications);
                        applyAISuggestions(modifications);
                    } catch (jsonError) {
                        console.error('JSON解析错误:', jsonError, '\n原始JSON字符串:', jsonMatch[0]);
                        alert('JSON格式无效: ' + jsonError.message);
                    }
                } else {
                    console.error('无法从响应中提取JSON数据，响应内容:', responseText);
                    alert('无法从AI响应中提取有效的修改建议');
                }
            } catch (e) {
                console.error('处理修改建议时出错:', e);
                alert('无法应用修改建议: ' + e.message);
            }
        } else {
            console.log('这是普通对话响应，不需要提取JSON');
        }
    } catch (e) {
        console.error('处理AI响应时出错:', e);
        alert('处理AI响应失败: ' + e.message);
    } finally {
        // 隐藏加载状态
        document.getElementById('loading').style.display = 'none';
    }
}

// 处理AI返回的JSON数据 - 使用新模块进行解析
function parseAIResponseJSON(content) {
    return window.mindmapModifier.parseAIResponse(content);
}

// 发送扩展内容请求
async function requestContentExpansion() {
    // 检查AI助手是否开启
    if (!aiAssistantEnabled) {
        addMessage('ai', window.i18n.t('enable_ai_first'));
        console.log('当前为对话模式，不允许扩展内容');
        return;
    }
    
    // 如果没有选中节点，尝试使用根节点
    if (!selectedNode && jm && jm.mind && jm.mind.root) {
        console.log('未选中节点，使用根节点');
        selectedNode = jm.mind.root;
    }
    
    // 检查是否有选中的节点
    if (!selectedNode) {
        addMessage('ai', window.i18n.t('select_node_for_modify'));
        return;
    }
    
    // 验证选中节点的有效性
    if (!selectedNode.id || typeof selectedNode.id !== 'string') {
        addMessage('ai', window.i18n.t('invalid_node_id'));
        console.error('选中节点无效:', selectedNode);
        return;
    }
    
    // 验证节点在jsMind中是否存在
    const nodeInMind = jm.get_node(selectedNode.id);
    if (!nodeInMind) {
        addMessage('ai', window.i18n.t('node_not_found', selectedNode.id));
        console.error('节点不存在于jsMind中:', selectedNode.id);
        return;
    }
    
    // 检查API密钥是否存在
    const apiKey = document.getElementById('api_key').value;
    if (!apiKey) {
        addMessage('ai', window.i18n.t('api_settings_prompt'));
        document.getElementById('api_settings').classList.add('show');
        return;
    }
    
    // 构建特定的提示词，要求AI扩展选中节点的内容
    const currentLang = window.i18n ? window.i18n.getCurrentLang() : 'zh';
    
    // 中英文提示词模板
    const expansionPrompts = {
        zh: `【思维导图内容扩展】请根据我的思维导图和当前选中的节点，提供详细的内容扩展。

当前思维导图结构: ${getMindmapStructure()}

当前选中的节点是: "${selectedNode ? selectedNode.topic : '根节点'}"

请沿着选中节点的思路继续深入扩展内容。提供与该节点主题相关的深入分析、详细信息或新的相关概念。

请先用文字简要概述你的扩展建议，说明你将如何深入当前节点的内容。
然后在文字概述后面，提供JSON格式的详细修改指令。

JSON格式要求如下:
[
  {"action": "添加子节点", "topic": "扩展主题1", "children": [
    {"topic": "子主题1.1", "note": "对子主题1.1的详细说明和补充信息"},
    {"topic": "子主题1.2", "children": [
      {"topic": "子主题1.2.1", "note": "对子主题1.2.1的详细说明和补充信息"}
    ]}
  ]},
  {"action": "添加注释", "topic": "详细的注释内容，提供对当前节点主题的深入解释。"}
]

请尽量提供丰富详细的内容，包括多级节点结构和深入的解释说明。`,

        en: `【MIND MAP CONTENT EXPANSION】Based on my mind map and the currently selected node, please provide detailed content expansion.

Current mind map structure: ${getMindmapStructure()}

Currently selected node: "${selectedNode ? selectedNode.topic : 'Root node'}"

Please continue to expand the content along the direction of the selected node. Provide in-depth analysis, detailed information, or new related concepts relevant to this node's topic.

First, please provide a brief text overview of your expansion suggestions, explaining how you will deepen the content of the current node.
Then after the text overview, provide the detailed modification instructions in JSON format.

The JSON format requirements are as follows:
[
  {"action": "添加子节点", "topic": "Expansion topic 1", "children": [
    {"topic": "Subtopic 1.1", "note": "(optional)Detailed explanation and supplementary information for subtopic 1.1"},
    {"topic": "Subtopic 1.2", "children": [
      {"topic": "Subtopic 1.2.1", "note": "(optional)Detailed explanation for the subtopic 1.2.1"}
    ]}
  ]},
  {"action": "添加注释", "topic": "Detailed note content providing in-depth explanation of the current node's topic."}
]

Please provide rich and detailed content, including multi-level node structures and in-depth explanations. Each important node should include detailed note content.`
    };
    
    const expansionPrompt = expansionPrompts[currentLang] || expansionPrompts.zh;
    
    // 在界面上显示加载状态
    document.getElementById('loading').style.display = 'block';
    
    // 添加用户请求消息
    const userRequestMessage = currentLang === 'en' ? 
        'Please expand the content of the selected node' : 
        '请扩展当前选中节点的内容';
    addMessage('user', userRequestMessage);
    
    try {
        // 准备发送请求
        const aiService = document.getElementById('ai_service').value;
        let endpoint;
        let headers = {'Content-Type': 'application/json'};
        let messages = [];
        
        const systemPrompts = {
            zh: `你是一个强大的思维导图助手，能够帮助用户扩展和深化思维导图中的内容。
请根据用户选择的节点，提供相关的深入内容、概念和解释。

对每个主要节点添加详细注释是非常重要的。注释能提供深层次信息、背景知识、使用场景和扩展阅读，大大增强思维导图的价值。请确保为每个关键节点添加内容丰富的注释。

当用户请求扩展内容时，请提供JSON格式的节点修改建议，遵循以下格式：

[
  {"action": "添加子节点", "topic": "扩展主题", "children": [
    {"topic": "子主题1", "note": "(可选)对子主题1的详细说明和补充信息"},
    {"topic": "子主题2", "children": [
      {"topic": "子子主题", "note": "(可选)对子子主题的详细说明"}
    ]}
  ]},
  {"action": "添加注释", "topic": "详细的注释内容，提供深入解释。"}
]

请确保你的建议与用户选择的节点主题相关，并提供有价值的内容扩展。每个重要节点都应包含详细的注释内容。`,

            en: `You are a powerful mind map assistant who can help users expand and deepen the content in their mind maps.
Based on the user's selected node, provide related in-depth content, concepts, and explanations.

【NOTE IMPORTANCE】Adding detailed notes to each major node is extremely important. Notes provide deeper information, background knowledge, use cases and extended reading, greatly enhancing the value of the mind map. Please ensure that every key node has rich, informative notes.

When the user requests content expansion, provide node modification suggestions in JSON format, following this structure:

[
  {"action": "添加子节点", "topic": "Expansion topic", "children": [
    {"topic": "Subtopic 1", "note": "(optional)Detailed explanation and supplementary information for subtopic 1"},
    {"topic": "Subtopic 2", "children": [
      {"topic": "Sub-subtopic", "note": "(optional)Detailed explanation for the sub-subtopic"}
    ]}
  ]},
  {"action": "添加注释", "topic": "Detailed note content providing in-depth explanation."}
]

Ensure your suggestions are relevant to the user's selected node topic and provide valuable content expansion. Every important node should include detailed note content.`
        };
        
        if (aiService === 'openai') {
            endpoint = 'https://api.openai.com/v1/chat/completions';
            
            messages = [
                { role: 'system', content: systemPrompts[currentLang] },
                { role: 'user', content: expansionPrompt }
            ];
            
            const requestData = {
                endpoint: endpoint,
                apiKey: apiKey,
                model: 'gpt-4o',
                messages: messages,
                temperature: 0.7,
                max_tokens: 2000
            };
            
            console.log('发送OpenAI内容扩展请求...');
            const data = await window.openaiApi.createCompletion(requestData);
            console.log('内容扩展请求响应:', data);
            
            // 处理响应
            if (data.choices && data.choices[0] && data.choices[0].message) {
                const content = data.choices[0].message.content;
                
                // 使用修改模块解析扩展建议
                const parseResult = parseAIResponseJSON(content);
                
                if (parseResult.success && parseResult.modifications) {
                    addMessage('ai', content, parseResult.modifications);
                } else {
                    console.error('解析扩展建议失败:', parseResult.error);
                    addMessage('ai', `无法解析扩展建议，AI返回的内容可能不是有效的JSON格式。以下是原始响应:\n\n${content}`);
                }
            } else {
                throw new Error('AI响应缺少必要数据');
            }
        } else if (aiService === 'deepseek') {
            endpoint = 'https://api.deepseek.com/v1/chat/completions';
            headers['Authorization'] = `Bearer ${apiKey}`;
            
            messages = [
                { role: 'system', content: systemPrompts[currentLang] },
                { role: 'user', content: expansionPrompt }
            ];
            
            const requestData = {
                endpoint: endpoint,
                headers: headers,
                model: 'deepseek-chat',
                messages: messages,
                temperature: 0.7,
                max_tokens: 2000
            };
            
            console.log('发送Deepseek内容扩展请求...');
            const data = await window.openaiApi.createCompletion(requestData);
            console.log('内容扩展请求响应:', data);
            
            // 处理响应
            if (data.choices && data.choices[0] && data.choices[0].message) {
                const content = data.choices[0].message.content;
                
                // 使用修改模块解析扩展建议
                const parseResult = parseAIResponseJSON(content);
                
                if (parseResult.success && parseResult.modifications) {
                    addMessage('ai', content, parseResult.modifications);
                } else {
                    console.error('解析扩展建议失败:', parseResult.error);
                    addMessage('ai', `无法解析扩展建议，AI返回的内容可能不是有效的JSON格式。以下是原始响应:\n\n${content}`);
                }
            } else {
                throw new Error('AI响应缺少必要数据');
            }
        } else if (aiService === 'azure') {
            // Azure实现暂时保留原样
            addMessage('ai', `暂不支持使用 ${aiService} 服务进行内容扩展。请切换到OpenAI或Deepseek服务。`);
        } else {
            throw new Error('不支持的AI服务');
        }
    } catch (error) {
        console.error('内容扩展请求错误:', error);
        addMessage('ai', `发生错误: ${error.message}`);
    } finally {
        document.getElementById('loading').style.display = 'none';
    }
}

