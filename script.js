// 调试日志
console.log('脚本开始加载');

// 全局变量
var jm = null;
var selectedNode = null;
var nodeIdCounter = 0;
var zoomLevel = 100; // 当前缩放级别百分比
var aiAssistantEnabled = false; // 控制AI助手是否启用

// 初始化jsMind
function initJsMind() {
    console.log('正在初始化jsMind...');
    
    if (typeof jsMind === 'undefined') {
        console.error('jsMind库未加载！');
        alert('思维导图库加载失败，请刷新页面重试。');
        return;
    }
    
    try {
        // 基本配置
        var options = {
            container: 'jsmind_container',
            editable: true,
            theme: 'primary',
            mode: 'full',
            view: {
                engine: 'canvas',
                hmargin: 100,
                vmargin: 50,
                line_width: 2,
                line_color: '#555'
            },
            layout: {
                hspace: 30,
                vspace: 20,
                pspace: 13
            }
        };
        
        // 初始思维导图数据
        var mind = {
            "meta": {
                "name": "我的思维导图",
                "author": "用户"
            },
            "format": "node_array",
            "data": [
                {"id": "root", "isroot": true, "topic": "中心节点"}
            ]
        };
        
        // 按推荐方式正确初始化jsMind
        jm = new jsMind(options);
        jm.show(mind);
        
        console.log('思维导图已显示:', jm);
        
        // 注册节点选择事件 - 增强节点内容读取和操作类型区分
        jm.add_event_listener(function(type, data) {
            if (type === jsMind.event_type.select) {
                console.group('[节点选择事件详细诊断]');
                try {
                    console.log('原始事件数据:', data);
                    console.log('jsMind实例状态:', {
                        initialized: !!jm,
                        hasData: !!jm.mind,
                        hasNodes: !!(jm.mind && jm.mind.nodes),
                        rootId: jm.mind?.root || 'unknown'
                    });
                    
                    // 第1步：安全获取节点
                    if (!data || !data.node) {
                        console.warn('事件数据中没有节点信息');
                console.groupEnd();
                return;
            }
            
                    // 第2步：确保节点有ID (关键修复点)
                    if (!data.node.id) {
                        // 尝试从其他属性获取ID
                        const possibleId = data.node.data?.id || data.node._data?.id;
                        
                        if (possibleId) {
                            // 显式设置ID
                            data.node.id = possibleId;
                            console.log('已从备用位置恢复节点ID:', possibleId);
                        } else {
                            // 最后手段：从DOM中获取选中节点的ID
                            const selectedNodeDOM = document.querySelector('jmnode.selected');
                            if (selectedNodeDOM) {
                                const domId = selectedNodeDOM.getAttribute('nodeid');
                                if (domId) {
                                    data.node.id = domId;
                                    console.log('已从DOM恢复节点ID:', domId);
                                }
                            }
                        }
                    }
                    
                    // 设置selectedNode
                    selectedNode = data.node;
                    console.log('节点基本信息:', {
                        id: selectedNode.id || '未知',
                        initialTopic: selectedNode.topic,
                        hasData: !!selectedNode.data
                    });
                    
                    // 第3步：多渠道获取节点文本 (关键修复点)
                    const recoveryMethods = [
                        // 方法1: 直接获取选中节点的topic
                        {
                            name: '直接topic属性',
                            value: selectedNode.topic,
                            success: !!selectedNode.topic
                        },
                        
                        // 方法2: 从data子对象获取
                        {
                            name: 'data.topic属性',
                            value: selectedNode.data?.topic,
                            success: !!selectedNode.data?.topic
                        },
                        
                        // 方法3: 通过jm.get_node获取
                        (() => {
                            try {
                                const result = {name: 'jm.get_node方法'};
                                if (selectedNode.id) {
                                    const node = jm.get_node(selectedNode.id);
                                    result.value = node?.topic;
                                    result.success = !!node?.topic;
                                } else {
                                    result.value = null;
                                    result.success = false;
                                }
                                return result;
                            } catch(e) {
                                return {name: 'jm.get_node方法(异常)', value: null, success: false, error: e};
                            }
                        })(),
                        
                        // 方法4: 直接从DOM中获取
                        (() => {
                            try {
                                const result = {name: 'DOM文本内容'};
                                const selector = selectedNode.id 
                                    ? `jmnode[nodeid="${selectedNode.id}"] .topic` 
                                    : 'jmnode.selected .topic';
                                    
                                const element = document.querySelector(selector);
                                result.value = element?.textContent?.trim();
                                result.success = !!result.value;
                                return result;
                            } catch(e) {
                                return {name: 'DOM文本内容(异常)', value: null, success: false, error: e};
                            }
                        })(),
                        
                        // 方法5: 遍历jsMind内部数据结构
                        (() => {
                            try {
                                const result = {name: 'jsMind内部数据'};
                                if (jm.mind && jm.mind.nodes && selectedNode.id) {
                                    const internalNode = jm.mind.nodes[selectedNode.id];
                                    result.value = internalNode?.topic;
                                    result.success = !!internalNode?.topic;
                                } else {
                                    result.value = null;
                                    result.success = false;
                                }
                                return result;
                            } catch(e) {
                                return {name: 'jsMind内部数据(异常)', value: null, success: false, error: e};
                            }
                        })()
                    ];
                    
                    console.log('所有文本获取方法结果:', recoveryMethods);
                    
                    // 第4步：选择第一个成功的方法的值作为topic
                    const successfulMethod = recoveryMethods.find(method => method.success);
                    
                    if (successfulMethod) {
                        console.log(`使用【${successfulMethod.name}】方法成功获取文本:`, successfulMethod.value);
                        selectedNode.topic = successfulMethod.value;
                    } else {
                        // 所有方法都失败，使用备用文本
                        const fallbackText = selectedNode.id ? `节点-${selectedNode.id}` : "未命名节点";
                        console.warn('所有获取文本方法失败，使用备用文本:', fallbackText);
                        selectedNode.topic = fallbackText;
                    }
                    
                    // 第5步：节点数据验证
                    const validNode = selectedNode.id ? jm.get_node(selectedNode.id) : null;
                    const validationResults = {
                        hasId: !!selectedNode.id,
                        isValid: !!validNode,
                        hasTopic: !!selectedNode.topic,
                        inNodesMap: !!(jm.mind?.nodes && selectedNode.id && jm.mind.nodes[selectedNode.id])
                    };
                    
                    console.log('节点有效性验证:', validationResults);
                    
                    // 第6步：尝试从jsMind实例中找到对应节点 (最后的修复尝试)
                    if (!validationResults.isValid && jm.mind && jm.mind.nodes) {
                        // 在所有节点中查找匹配DOM选中状态的节点
                        const selectedDOM = document.querySelector('jmnode.selected');
                        if (selectedDOM) {
                            const selectedDOMId = selectedDOM.getAttribute('nodeid');
                            
                            if (selectedDOMId && jm.mind.nodes[selectedDOMId]) {
                                const correctNode = jm.mind.nodes[selectedDOMId];
                                console.log('从DOM中找到正确节点:', correctNode);
                                
                                // 更新selectedNode到正确节点
                                selectedNode = correctNode;
                                
                                // 确保topic存在
                                if (!selectedNode.topic && selectedDOM.querySelector('.topic')) {
                                    selectedNode.topic = selectedDOM.querySelector('.topic').textContent.trim();
                                }
                            }
                        }
                    }
                    
                    // 第7步：最终状态汇报
                    console.log('最终节点状态:', {
                        id: selectedNode.id || '未知',
                        topic: selectedNode.topic || '未获取到',
                        isValid: validationResults.isValid
                    });
                    
                    // 仅在AI助手开启时显示消息
    if (aiAssistantEnabled) {
                        const message = selectedNode.topic
                            ? `您选中了节点："${selectedNode.topic}"`
                            : `您选中了一个节点（无法获取文本）`;
                        
                        addMessage('ai', message);
                        
                        // 尝试读取子节点信息 (增强用户体验)
                        try {
                            if (selectedNode.id) {
                                const childInfo = getChildrenInfo(selectedNode);
                                if (childInfo) {
                                    addMessage('ai', `此节点包含的内容:\n${childInfo}`);
                    }
                }
            } catch (e) {
                            console.warn('获取子节点信息失败:', e);
                        }
                    }
                    
                } catch (error) {
                    console.error('节点选择事件处理异常:', error);
                }
                console.groupEnd();
            }
        });
        
        // 启用拖拽节点 - 使用插件提供的能力
        if (typeof jsMind.draggable === 'function') {
            jsMind.draggable(jm);
        }
        
    } catch (error) {
        console.error('jsMind初始化失败:', error);
        alert('思维导图初始化失败: ' + error.message);
    }
}

// 生成唯一ID
function generateUniqueID() {
    return 'node_' + (nodeIdCounter++);
}

// 初始化工具栏
function initToolbar() {
    console.log('初始化工具栏...');
    
    // 添加节点
    document.getElementById('add_node').addEventListener('click', function() {
        console.group('[添加节点操作]');
        try {
            if (!selectedNode) {
                console.warn('未选中节点，无法添加子节点');
                alert('请先选择一个节点');
                console.groupEnd();
                return;
            }
            
            if (!selectedNode.id) {
                console.warn('选中节点ID无效:', selectedNode);
                alert('选中的节点无效，请重新选择');
                console.groupEnd();
                return;
            }
            
            const newNodeId = generateUniqueID();
            const newTopic = "新节点";
            console.log('添加新节点参数:', {
                parentId: selectedNode.id || '未知',
                newNodeId: newNodeId,
                parentTopic: selectedNode.topic || '未知'
            });

            jm.add_node(selectedNode, newNodeId, newTopic);
            
            // 延迟验证新增节点
            setTimeout(() => {
                const addedNode = jm.get_node(newNodeId);
                console.log('新增节点验证:', {
                    exists: !!addedNode,
                    actualTopic: addedNode?.topic || '未获取到',
                    parentMatch: addedNode?.parent?.id === selectedNode.id
                });
                
                if (addedNode && (!addedNode.topic || addedNode.topic !== newTopic)) {
                    console.warn('节点文本未正确设置，尝试修复...');
                    try {
                        jm.update_node(newNodeId, newTopic);
                    } catch (e) {
                        console.error('更新节点文本失败:', e);
                    }
                }
            }, 100);
        } catch (error) {
            console.error('添加节点失败:', error);
            alert('添加节点失败: ' + error.message);
        }
        console.groupEnd();
    });
    
    // 编辑节点
    document.getElementById('edit_node').addEventListener('click', function() {
        if (selectedNode) {
            const newTopic = prompt('编辑节点主题:', selectedNode.topic);
            if (newTopic) {
                jm.update_node(selectedNode.id, newTopic);
            }
        } else {
            alert('请先选择一个节点');
        }
    });
    
    // 删除节点
    document.getElementById('delete_node').addEventListener('click', function() {
        if (selectedNode && !selectedNode.isroot) {
            if (confirm('确定要删除这个节点及其子节点吗？')) {
                jm.remove_node(selectedNode);
                selectedNode = null;
            }
        } else if (selectedNode && selectedNode.isroot) {
            alert('不能删除根节点');
        } else {
            alert('请先选择一个节点');
        }
    });
    
    // 展开全部
    document.getElementById('expand_all').addEventListener('click', function() {
        jm.expand_all();
    });
    
    // 折叠全部
    document.getElementById('collapse_all').addEventListener('click', function() {
        jm.collapse_all();
    });
    
    // 主题切换
    document.getElementById('theme_select').addEventListener('change', function() {
        jm.set_theme(this.value);
    });
    
    // 保存导图
    document.getElementById('save_map').addEventListener('click', function() {
        const data = jm.get_data();
        const json = JSON.stringify(data);
        const blob = new Blob([json], {type: 'application/json'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = '思维导图_' + new Date().toISOString().slice(0, 10) + '.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });
    
    // 加载导图
    document.getElementById('load_map').addEventListener('click', function() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = function(event) {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    try {
                        const data = JSON.parse(e.target.result);
                        jm.show(data);
                    } catch (error) {
                        alert('文件格式错误');
                        console.error('加载文件失败:', error);
                    }
                };
                reader.readAsText(file);
            }
        };
        input.click();
    });
}

// 初始化缩放控制器
function initZoomController() {
    // 放大按钮
    document.getElementById('zoom_in').addEventListener('click', function() {
        if (zoomLevel < 200) {
            zoomLevel += 10;
            updateZoom();
        }
    });
    
    // 缩小按钮
    document.getElementById('zoom_out').addEventListener('click', function() {
        if (zoomLevel > 50) {
            zoomLevel -= 10;
            updateZoom();
        }
    });
    
    // 重置视图按钮
    document.getElementById('reset_view').addEventListener('click', function() {
        zoomLevel = 100;
        updateZoom();
    });
    
    // 居中视图按钮
    document.getElementById('center_view').addEventListener('click', function() {
        if (jm && jm.get_root) {
            const root = jm.get_root();
            if (root) {
                jm.select_node(root.id);
            }
        }
    });
}

// 更新缩放级别 - 使用jsMind提供的标准缩放方法
function updateZoom() {
    document.getElementById('zoom_text').innerText = zoomLevel + '%';
    
    // 使用jsMind提供的标准缩放方法
    if (jm && jm.view && typeof jm.view.set_zoom === 'function') {
        jm.view.set_zoom(zoomLevel / 100);
    }
}

// 初始化AI对话功能
function initChat() {
    // 添加AI助手开关按钮到聊天头部
    const chatHeader = document.querySelector('.chat-header');
    const toggleButton = document.createElement('button');
    toggleButton.id = 'ai_toggle';
    toggleButton.className = 'ai-toggle-btn';
    toggleButton.innerHTML = aiAssistantEnabled ? '关闭AI助手' : '开启AI助手';
    toggleButton.onclick = toggleAIAssistant;
    
    // 放在设置按钮之前
    const settingsToggle = document.getElementById('settings_toggle');
    if (settingsToggle && chatHeader) {
        chatHeader.insertBefore(toggleButton, settingsToggle);
    } else if (chatHeader) {
        chatHeader.appendChild(toggleButton);
    }
    
    // 添加CSS样式
    const style = document.createElement('style');
    style.textContent = `
        .ai-toggle-btn {
            padding: 5px 10px;
            background-color: ${aiAssistantEnabled ? '#f44336' : '#4CAF50'};
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            margin-right: 10px;
            font-size: 0.9em;
        }
        
        .settings-toggle {
            display: flex;
            align-items: center;
        }
    `;
    document.head.appendChild(style);
    
    // 其他初始化代码
    document.getElementById('send_button').addEventListener('click', sendMessage);
    
    document.getElementById('chat_input').addEventListener('keypress', function(event) {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            sendMessage();
        }
    });
    
    document.getElementById('settings_toggle').addEventListener('click', function() {
        const settingsPanel = document.getElementById('api_settings');
        settingsPanel.classList.toggle('show');
    });
    
    setTimeout(function() {
        const settingsPanel = document.getElementById('api_settings');
        if (!settingsPanel.classList.contains('show')) {
            settingsPanel.classList.add('show');
        }
    }, 100);
    
    document.getElementById('chat_input').addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = (this.scrollHeight < 120) ? this.scrollHeight + 'px' : '120px';
    });
}

// 发送消息
function sendMessage() {
    const inputEl = document.getElementById('chat_input');
    const message = inputEl.value.trim();
    
    if (!message) return;
    
    // 显示用户消息
    addMessage('user', message);
    inputEl.value = '';
    inputEl.style.height = '44px'; // 重置高度
    
    // 检查AI助手是否开启
    if (!aiAssistantEnabled) {
        addMessage('ai', 'AI助手当前已关闭，请先开启AI助手。');
        return;
    }
    
    // 检查是否选择了节点
    if (!selectedNode) {
        addMessage('ai', '请先选择一个思维导图节点，然后再向我提问。');
        return;
    }
    
    // 提交给AI处理
    processAIRequest(message);
}

// 添加消息到聊天区域
function addMessage(sender, text) {
    const messagesEl = document.getElementById('chat_messages');
    const messageEl = document.createElement('div');
    messageEl.className = `message ${sender}-message`;
    
    // 处理可能包含建议的AI消息
    if (sender === 'ai' && text.includes('建议的子主题:')) {
        const parts = text.split('建议的子主题:');
        const message = parts[0];
        const suggestions = parts[1].trim();
        
        // 添加消息文本
        messageEl.innerText = message + "\n建议的子主题:";
        
        // 添加建议列表
        const suggestionsEl = document.createElement('div');
        suggestionsEl.className = 'suggestions-list';
        
        const topics = suggestions.split('\n');
        topics.forEach(topic => {
            if (topic.trim()) {
                suggestionsEl.innerHTML += `• ${topic.trim()}<br>`;
            }
        });
        
        // 添加应用按钮
        const applyButton = document.createElement('button');
        applyButton.className = 'apply-button';
        applyButton.innerText = '应用这些建议';
        applyButton.onclick = function() {
            topics.forEach(topic => {
                if (topic.trim()) {
                    const newNodeId = generateUniqueID();
                    const topicText = topic.trim();
                    
                    // 添加节点
                    jm.add_node(selectedNode, newNodeId, topicText);
                    
                    // 确保新节点topic设置正确
                    setTimeout(function() {
                        const newNode = jm.get_node(newNodeId);
                        if (newNode && (!newNode.topic || newNode.topic !== topicText)) {
                            try {
                                jm.update_node(newNodeId, topicText);
                            } catch(e) {
                                console.error('更新AI建议节点topic失败:', e);
                            }
                        }
                    }, 50);
                }
            });
            addMessage('ai', '已将建议的子主题添加到思维导图中。');
        };
        
        messageEl.appendChild(suggestionsEl);
        messageEl.appendChild(applyButton);
    } else {
        messageEl.innerText = text;
    }
    
    messagesEl.appendChild(messageEl);
    messagesEl.scrollTop = messagesEl.scrollHeight;
}

// 重新实现获取子节点信息函数 - 完全防御性编程
function getChildrenInfo(node) {
    console.group('获取子节点信息');
    try {
        if (!node) {
            console.warn('节点对象为空');
            console.groupEnd();
            return '';
        }
        
        if (!node.id) {
            console.warn('节点ID为空');
            console.groupEnd();
            return '';
        }
        
        console.log('尝试获取节点的子节点:', node.id);
        
        // 方法1: 通过jm.mind.nodes[id].children获取子节点ID列表
        let childrenIds = [];
        let children = [];
        
        try {
            if (jm.mind && jm.mind.nodes && jm.mind.nodes[node.id]) {
                childrenIds = jm.mind.nodes[node.id].children || [];
                console.log('通过内部结构找到子节点ID:', childrenIds);
                
                // 从nodes映射中获取子节点对象
                children = childrenIds
                    .map(id => jm.mind.nodes[id])
                    .filter(node => !!node);
                    
                console.log('找到子节点对象数量:', children.length);
            }
        } catch (e) {
            console.warn('通过内部结构获取子节点失败:', e);
            children = [];
        }
        
        // 方法2: 如果上述方法失败，尝试从DOM中获取子节点
        if (children.length === 0) {
            try {
                const nodeDOM = document.querySelector(`jmnode[nodeid="${node.id}"]`);
                if (nodeDOM) {
                    // 寻找下一级jmnode元素
                    const childNodeElements = Array.from(document.querySelectorAll('jmnode'))
                        .filter(el => {
                            // 找出父节点ID与当前节点ID匹配的元素
                            const parentLine = document.querySelector(`jmexpander[nodeid="${el.getAttribute('nodeid')}"]`);
                            return parentLine && parentLine.getAttribute('expanded') === node.id;
                        });
                    
                    console.log('通过DOM找到子节点数量:', childNodeElements.length);
                    
                    // 从DOM元素中提取topic
                    children = childNodeElements.map(el => {
                        return { 
                            topic: el.querySelector('.topic')?.textContent?.trim() || '未命名节点'
                        };
                    });
                }
            } catch (e) {
                console.warn('通过DOM获取子节点失败:', e);
            }
        }
        
        // 格式化子节点文本
        if (children.length === 0) {
            console.log('未找到子节点');
            console.groupEnd();
            return '';
        }
        
        let childrenText = children
            .filter(child => child && (child.topic || child.data?.topic))
            .map(child => {
                let topic = child.topic || child.data?.topic || '未命名节点';
                return `• ${topic}`;
            })
            .join('\n');
            
        console.log('子节点文本:', childrenText);
        console.groupEnd();
        return childrenText.trim();
    } catch (error) {
        console.error('获取子节点信息错误:', error);
        console.groupEnd();
        return '';
    }
}

// 修改处理AI请求函数，增加节点上下文信息
async function processAIRequest(query) {
    console.group('[AI请求流程]');
    try {
        // 前置验证
        console.log('请求前验证:', {
            selectedNodeExists: !!selectedNode,
            selectedNodeId: selectedNode?.id,
            currentTopic: selectedNode?.topic
        });

        // 强制刷新节点数据
        if (selectedNode) {
            const freshNode = jm.get_node(selectedNode.id);
            if (freshNode && freshNode.topic !== selectedNode.topic) {
                console.log('检测到节点数据更新，旧topic:', selectedNode.topic, '新topic:', freshNode.topic);
                selectedNode.topic = freshNode.topic;
            }
        }

        const aiService = document.getElementById('ai_service').value;
        const apiKey = document.getElementById('api_key').value;
        
        if (!apiKey) {
            addMessage('ai', '请先点击右上角设置，输入API密钥。');
            document.getElementById('api_settings').classList.add('show');
            return;
        }
        
        let nodeTopic = selectedNode ? selectedNode.topic : "未选择节点";
        let isRoot = selectedNode ? (selectedNode.isroot || selectedNode.id === 'root') : false;
        let childrenInfo = selectedNode ? getChildrenInfo(selectedNode) : '';
        
        // 构建完整的上下文信息
        let contextInfo = `思维导图节点："${nodeTopic}"`;
        if (isRoot) {
            contextInfo += "（这是根节点，作用于整个思维导图）";
        }
        
        if (childrenInfo) {
            contextInfo += `\n子节点内容:\n${childrenInfo}`;
        }
        
        let prompt = `${contextInfo}\n用户问题："${query}"`;
        
        // 根据查询内容判断是否为请求子主题
        if (query.includes('子主题') || query.includes('扩展') || 
            query.includes('相关概念') || query.includes('建议')) {
            prompt += `。请基于当前节点的主题"${nodeTopic}"，生成3-5个相关子主题，每行一个，不要编号，格式简洁。`;
        }
        
        // 调用API
        let response;
        if (aiService === 'openai') {
            response = await callOpenAI(apiKey, prompt);
        } else {
            response = await callDeepseek(apiKey, prompt);
        }
        
        // 处理响应
        if (response) {
            if (query.includes('子主题') || query.includes('扩展') || 
                query.includes('相关概念') || query.includes('建议')) {
                // 格式化子主题建议
                addMessage('ai', `我为"${nodeTopic}"想到了以下几个相关概念。\n建议的子主题:\n${response}`);
            } else {
                // 普通回复
                addMessage('ai', response);
            }
        }
    } catch (error) {
        console.error('AI处理流程异常:', error);
        addMessage('ai', `抱歉，处理您的请求时出错: ${error.message}`);
    } finally {
        // 隐藏加载状态
        document.getElementById('loading').style.display = 'none';
        console.groupEnd();
    }
}

// 修改API调用，增加系统提示明确操作类型
async function callOpenAI(apiKey, prompt) {
    const systemPrompt = '您是一个帮助用户构建思维导图的AI助手。'
                       + '您可以帮助用户扩展思维导图节点，提供子主题建议，回答关于思维导图内容的问题。'
                       + '当被要求提供子主题时，请直接列出相关概念，每行一个，不要编号。'
                       + '当用户选择根节点时，您的建议会影响整个思维导图；当用户选择普通节点时，您的建议会影响该节点及其子节点。';
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: [
                {role: 'system', content: systemPrompt},
                {role: 'user', content: prompt}
            ],
            max_tokens: 500
        })
    });
    
    if (!response.ok) {
        const error = await response.json();
        throw new Error(`OpenAI API错误 (${response.status}): ${error.error?.message || '未知错误'}`);
    }
    
    const data = await response.json();
    return data.choices[0].message.content;
}

// 同样修改Deepseek调用
async function callDeepseek(apiKey, prompt) {
    const systemPrompt = '您是一个帮助用户构建思维导图的AI助手。'
                       + '您可以帮助用户扩展思维导图节点，提供子主题建议，回答关于思维导图内容的问题。'
                       + '当被要求提供子主题时，请直接列出相关概念，每行一个，不要编号。'
                       + '当用户选择根节点时，您的建议会影响整个思维导图；当用户选择普通节点时，您的建议会影响该节点及其子节点。';
    
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: 'deepseek-chat',
            messages: [
                {role: 'system', content: systemPrompt},
                {role: 'user', content: prompt}
            ],
            max_tokens: 500
        })
    });
    
    if (!response.ok) {
        const error = await response.json();
        throw new Error(`Deepseek API错误 (${response.status}): ${error.error?.message || '未知错误'}`);
    }
    
    const data = await response.json();
    return data.choices[0].message.content;
}

// 添加切换AI助手状态的函数
function toggleAIAssistant() {
    aiAssistantEnabled = !aiAssistantEnabled;
    
    // 更新按钮文本和样式
    const toggleButton = document.getElementById('ai_toggle');
    if (toggleButton) {
        toggleButton.innerHTML = aiAssistantEnabled ? '关闭AI助手' : '开启AI助手';
        toggleButton.style.backgroundColor = aiAssistantEnabled ? '#f44336' : '#4CAF50';
    }
    
    // 添加状态提示消息
    if (aiAssistantEnabled) {
        addMessage('ai', 'AI助手已开启，将自动回应您的节点选择和问题。');
    } else {
        addMessage('ai', 'AI助手已关闭，不会自动回应您的节点选择。您仍可以手动提问。');
    }
}

// 修复节点数据监控
function setupNodeMonitor() {
    let lastNodeState = {};
    const intervalId = setInterval(() => {
        try {
            if (!selectedNode || !selectedNode.id) {
                return; // 没有选中节点，不执行监控
            }
            
            // 重新获取最新的节点数据
            const freshNode = jm.get_node(selectedNode.id);
            if (!freshNode) {
                console.warn('监控: 无法通过ID获取最新节点数据:', selectedNode.id);
                return;
            }
            
            // 获取子节点数据 - 使用内部数据结构而非API
            let childrenTopics = [];
            try {
                if (jm.mind && jm.mind.nodes) {
                    const nodeData = jm.mind.nodes[selectedNode.id];
                    if (nodeData && nodeData.children) {
                        childrenTopics = nodeData.children
                            .map(childId => {
                                const child = jm.mind.nodes[childId];
                                return child ? (child.topic || '未命名') : '无效节点';
                            });
                    }
                }
            } catch (e) {
                console.warn('监控: 获取子节点失败:', e);
                childrenTopics = [];
            }
            
            const currentState = {
                id: selectedNode.id,
                topic: freshNode.topic || selectedNode.topic,
                children: childrenTopics
            };
            
            // 检测变化
            const prevStateStr = JSON.stringify(lastNodeState);
            const currStateStr = JSON.stringify(currentState);
            
            if (prevStateStr !== currStateStr) {
                console.log('节点状态变化:', {
                    before: lastNodeState,
                    after: currentState
                });
                
                // 如果topic发生变化，更新selectedNode
                if (freshNode.topic && freshNode.topic !== selectedNode.topic) {
                    console.log('更新selectedNode.topic:', selectedNode.topic, '->', freshNode.topic);
                    selectedNode.topic = freshNode.topic;
                }
                
                lastNodeState = currentState;
            }
        } catch (error) {
            console.error('节点监控异常:', error);
        }
    }, 2000); // 每2秒检查一次
    
    // 返回清理函数
    return function stopMonitor() {
        clearInterval(intervalId);
    };
}

// 启动节点监控
const stopNodeMonitor = setupNodeMonitor();

// 保险措施：页面关闭前清理监控
window.addEventListener('beforeunload', function() {
    if (typeof stopNodeMonitor === 'function') {
        stopNodeMonitor();
    }
});

// 添加额外的DOM观察器来监听节点变化
function setupDOMObserver() {
    // 创建DOM变化观察器
    const observer = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
            if (mutation.type === 'childList' || mutation.type === 'attributes') {
                // 如果有选中的节点变化
                const selectedDOMNode = document.querySelector('jmnode.selected');
                if (selectedDOMNode) {
                    const domId = selectedDOMNode.getAttribute('nodeid');
                    const domTopic = selectedDOMNode.querySelector('.topic')?.textContent?.trim();
                    
                    // 如果DOM中的选中节点与selectedNode不匹配，则更新selectedNode
                    if (selectedNode && (selectedNode.id !== domId || selectedNode.topic !== domTopic)) {
                        console.log('DOM选中节点变化检测:', {
                            oldId: selectedNode.id, 
                            newId: domId,
                            oldTopic: selectedNode.topic,
                            newTopic: domTopic
                        });
                        
                        // 更新selectedNode
                        if (domId && domTopic) {
                            selectedNode.id = domId;
                            selectedNode.topic = domTopic;
                        }
                    }
                }
            }
        });
    });
    
    // 开始观察整个思维导图容器
    observer.observe(document.getElementById('jsmind_container'), {
        childList: true,
        attributes: true,
        subtree: true,
        attributeFilter: ['class', 'nodeid']
    });
    
    return observer;
}

// 页面加载完成后初始化DOM观察器
document.addEventListener('DOMContentLoaded', function() {
    const observer = setupDOMObserver();
    
    // 页面关闭时断开观察器
    window.addEventListener('beforeunload', function() {
        observer.disconnect();
    });
});

// 页面加载完成后初始化 - 增加延迟时间确保完全加载
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM已加载完成，准备初始化应用');
    
    // 延长初始化时间确保资源完全加载
    setTimeout(function() {
        initJsMind();
        
        // 确保jsMind完全初始化后再初始化其他组件
        setTimeout(function() {
            initToolbar();
            initZoomController();
            initChat();
            
            // 额外检查默认根节点
            try {
                if (jm && jm.get_root) {
                    const root = jm.get_root();
                    if (root) {
                        console.log('根节点信息:', {
                            id: root.id,
                            topic: root.topic,
                            isroot: root.isroot
                        });
                    }
                }
            } catch (e) {
                console.error('检查根节点失败:', e);
            }
        }, 200);
    }, 800);
}); 