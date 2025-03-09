// 调试日志
console.log('脚本开始加载');

// 全局变量
var jm = null;
var selectedNode = null;
var nodeIdCounter = 0;
var zoomLevel = 100; // 当前缩放级别百分比
var aiAssistantEnabled = false; // 控制AI助手是否启用

// 添加全局变量来存储对话历史和状态
let conversationHistory = [];
let isFirstQuery = true; // 标记是否是首次对话
const MAX_CONTEXT_LENGTH = 10; // 设置最大上下文长度

// 在全局变量区域添加新功能的状态管理
let nodeNotes = {}; // 保存节点备注
let relationLines = []; // 保存关联线信息
let nodeSummaries = {}; // 保存节点摘要

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
    console.log('初始化工具栏');
    const toolbar = document.getElementById('toolbar');
    
    // 清空工具栏，防止重复添加
    toolbar.innerHTML = '';
    
    // 基本操作按钮
    const addBtn = document.createElement('button');
    addBtn.className = 'btn';
    addBtn.id = 'add_node';
    addBtn.textContent = '添加节点';
    toolbar.appendChild(addBtn);
    
    const editBtn = document.createElement('button');
    editBtn.className = 'btn';
    editBtn.id = 'edit_node';
    editBtn.textContent = '编辑节点';
    toolbar.appendChild(editBtn);
    
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn';
    deleteBtn.id = 'delete_node';
    deleteBtn.textContent = '删除节点';
    toolbar.appendChild(deleteBtn);
    
    // 扩展与折叠按钮
    const expandBtn = document.createElement('button');
    expandBtn.className = 'btn';
    expandBtn.id = 'expand_all';
    expandBtn.textContent = '展开全部';
    toolbar.appendChild(expandBtn);
    
    const collapseBtn = document.createElement('button');
    collapseBtn.className = 'btn';
    collapseBtn.id = 'collapse_all';
    collapseBtn.textContent = '折叠全部';
    toolbar.appendChild(collapseBtn);
    
    // 主题选择
    const themeSelect = document.createElement('select');
    themeSelect.id = 'theme_select';
    themeSelect.title = '选择主题';
    
    const themes = [
        {value: 'primary', text: '蓝色主题'},
        {value: 'warning', text: '黄色主题'},
        {value: 'danger', text: '红色主题'},
        {value: 'success', text: '绿色主题'}
    ];
    
    themes.forEach(theme => {
        const option = document.createElement('option');
        option.value = theme.value;
        option.textContent = theme.text;
        themeSelect.appendChild(option);
    });
    
    toolbar.appendChild(themeSelect);
    
    // 创建分隔符
    const createSeparator = () => {
        const separator = document.createElement('div');
        separator.style.borderLeft = '1px solid #ddd';
        separator.style.height = '24px';
        separator.style.margin = '0 10px';
        return separator;
    };
    
    // 添加分隔符
    toolbar.appendChild(createSeparator());
    
    // 添加新增功能按钮 - LaTeX公式
    const latexBtn = document.createElement('button');
    latexBtn.className = 'btn';
    latexBtn.id = 'latex_button';
    latexBtn.textContent = '公式';
    latexBtn.title = '插入LaTeX公式';
    latexBtn.addEventListener('click', openLatexEditor);
    toolbar.appendChild(latexBtn);
    
    // 备注功能
    const noteBtn = document.createElement('button');
    noteBtn.className = 'btn';
    noteBtn.id = 'note_button';
    noteBtn.textContent = '备注';
    noteBtn.title = '添加节点备注';
    noteBtn.addEventListener('click', openNoteEditor);
    toolbar.appendChild(noteBtn);
    
    // 关联线功能
    const relationBtn = document.createElement('button');
    relationBtn.className = 'btn';
    relationBtn.id = 'relation_button';
    relationBtn.textContent = '关联线';
    relationBtn.title = '创建节点间的关联线';
    relationBtn.addEventListener('click', startRelationLine);
    toolbar.appendChild(relationBtn);
    
    // 摘要功能
    const summaryBtn = document.createElement('button');
    summaryBtn.className = 'btn';
    summaryBtn.id = 'summary_button';
    summaryBtn.textContent = '摘要';
    summaryBtn.title = '为节点添加摘要';
    summaryBtn.addEventListener('click', openSummaryEditor);
    toolbar.appendChild(summaryBtn);
    
    // 再添加一个分隔符
    toolbar.appendChild(createSeparator());
    
    // 创建保存按钮组（带下拉菜单）
    const saveGroup = document.createElement('div');
    saveGroup.className = 'btn-group';
    saveGroup.style.position = 'relative';
    saveGroup.style.display = 'inline-block';
    
    // 主保存按钮
    const saveBtn = document.createElement('button');
    saveBtn.className = 'btn';
    saveBtn.id = 'save_map';
    saveBtn.textContent = '保存';
    saveBtn.title = '保存思维导图';
    saveBtn.onclick = function() {
        // 切换下拉菜单的显示状态
        const dropdown = document.getElementById('save_dropdown');
        dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
    };
    
    // 下拉菜单
    const saveDropdown = document.createElement('div');
    saveDropdown.id = 'save_dropdown';
    saveDropdown.style.display = 'none';
    saveDropdown.style.position = 'absolute';
    saveDropdown.style.backgroundColor = '#f9f9f9';
    saveDropdown.style.minWidth = '160px';
    saveDropdown.style.boxShadow = '0px 8px 16px 0px rgba(0,0,0,0.2)';
    saveDropdown.style.zIndex = '1';
    saveDropdown.style.borderRadius = '4px';
    saveDropdown.style.overflow = 'hidden';
    
    // 添加JSON保存选项
    const saveJsonOption = document.createElement('a');
    saveJsonOption.href = '#';
    saveJsonOption.textContent = '保存为JSON';
    saveJsonOption.style.padding = '10px 16px';
    saveJsonOption.style.textDecoration = 'none';
    saveJsonOption.style.display = 'block';
    saveJsonOption.style.color = 'black';
    saveJsonOption.onmouseover = function() {
        this.style.backgroundColor = '#f1f1f1';
    };
    saveJsonOption.onmouseout = function() {
        this.style.backgroundColor = 'transparent';
    };
    saveJsonOption.onclick = function(e) {
        e.preventDefault();
        saveAsJson();
        saveDropdown.style.display = 'none';
    };
    
    // 添加MD保存选项
    const saveMdOption = document.createElement('a');
    saveMdOption.href = '#';
    saveMdOption.textContent = '导出为Markdown';
    saveMdOption.style.padding = '10px 16px';
    saveMdOption.style.textDecoration = 'none';
    saveMdOption.style.display = 'block';
    saveMdOption.style.color = 'black';
    saveMdOption.onmouseover = function() {
        this.style.backgroundColor = '#f1f1f1';
    };
    saveMdOption.onmouseout = function() {
        this.style.backgroundColor = 'transparent';
    };
    saveMdOption.onclick = function(e) {
        e.preventDefault();
        exportToMarkdown();
        saveDropdown.style.display = 'none';
    };
    
    // 组装下拉菜单
    saveDropdown.appendChild(saveJsonOption);
    saveDropdown.appendChild(saveMdOption);
    
    // 组装保存按钮组
    saveGroup.appendChild(saveBtn);
    saveGroup.appendChild(saveDropdown);
    toolbar.appendChild(saveGroup);
    
    // 加载按钮
    const loadBtn = document.createElement('button');
    loadBtn.className = 'btn';
    loadBtn.id = 'load_map';
    loadBtn.textContent = '加载';
    toolbar.appendChild(loadBtn);
    
    // 点击文档其他区域关闭下拉菜单
    document.addEventListener('click', function(event) {
        if (!saveGroup.contains(event.target)) {
            saveDropdown.style.display = 'none';
        }
    });
    
    // 为按钮绑定事件
    document.getElementById('add_node').addEventListener('click', function() {
        if (selectedNode) {
            const newNodeId = generateUniqueID();
            jm.add_node(selectedNode, newNodeId, '新节点');
        } else {
            alert('请先选择一个节点');
        }
    });
    
    document.getElementById('edit_node').addEventListener('click', function() {
        if (selectedNode) {
            const newTopic = prompt('请输入新的节点内容:', selectedNode.topic);
            if (newTopic !== null) {
                jm.update_node(selectedNode.id, newTopic);
            }
        } else {
            alert('请先选择一个节点');
        }
    });
    
    document.getElementById('delete_node').addEventListener('click', function() {
        if (selectedNode && !selectedNode.isroot) {
            if (confirm('确定要删除此节点及其所有子节点吗?')) {
                jm.remove_node(selectedNode);
            }
        } else if (selectedNode && selectedNode.isroot) {
            alert('不能删除根节点');
        } else {
            alert('请先选择一个节点');
        }
    });
    
    document.getElementById('expand_all').addEventListener('click', function() {
        jm.expand_all();
    });
    
    document.getElementById('collapse_all').addEventListener('click', function() {
        jm.collapse_all();
    });
    
    document.getElementById('theme_select').addEventListener('change', function() {
        jm.set_theme(this.value);
    });
    
    document.getElementById('load_map').addEventListener('click', function() {
        loadMindMap();
    });
    
    console.log('工具栏初始化完成，添加了所有功能按钮');
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

// 修改initChat函数，确保API设置面板默认折叠
function initChat() {
    const style = document.createElement('style');
    style.textContent = `
        /* 聊天控制区域样式 */
        .chat-top-controls {
            display: flex;
            justify-content: space-between;
            padding: 10px 15px;
            background-color: #f0f0f0;
            border-bottom: 1px solid #ddd;
        }
        
        /* 绿色圆角新对话按钮 */
        #new_conversation {
            background-color: #4CAF50;
            color: white;
            border: none;
            border-radius: 20px;
            padding: 5px 15px;
            cursor: pointer;
            font-size: 0.9rem;
        }
        
        #new_conversation:hover {
            background-color: #45a049;
        }
        
        /* AI助手开关按钮样式 */
        #ai_toggle {
            background-color: #4CAF50;
            color: white;
            border: none;
            border-radius: 20px;
            padding: 5px 15px;
            cursor: pointer;
            font-size: 0.9rem;
        }
        
        /* 设置按钮样式 */
        #settings_toggle {
            background-color: #2196F3;
            color: white;
            border: none;
            border-radius: 20px;
            padding: 5px 15px;
            cursor: pointer;
            font-size: 0.9rem;
        }
        
        #settings_toggle:hover {
            background-color: #0b7dda;
        }
        
        .ai-suggestion {
            background-color: #e3f2fd;
            border-left: 3px solid #2196F3;
            padding: 8px;
            margin: 10px 0;
            font-size: 0.9em;
        }
        
        .mindmap-modification {
            background-color: #f1f8e9;
            border-left: 3px solid #8bc34a;
            padding: 10px;
            margin: 10px 0;
            font-family: monospace;
            white-space: pre;
            overflow-x: auto;
        }
        
        .modification-controls {
            display: flex;
            justify-content: flex-end;
            margin-top: 10px;
            gap: 10px;
        }
        
        .apply-button {
            background-color: #4CAF50;
            color: white;
            border: none;
            padding: 5px 10px;
            border-radius: 4px;
            cursor: pointer;
        }
        
        .reject-button {
            background-color: #f44336;
            color: white;
            border: none;
            padding: 5px 10px;
            border-radius: 4px;
            cursor: pointer;
        }
        
        /* 修改chat-header样式，移除设置按钮 */
        .chat-header {
            padding: 15px;
            background-color: #f5f5f5;
            font-weight: bold;
            border-bottom: 1px solid #ddd;
            display: flex;
            justify-content: center;
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
    
    document.getElementById('chat_input').addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = (this.scrollHeight < 120) ? this.scrollHeight + 'px' : '120px';
    });
    
    // 获取关键DOM元素
    const chatContainer = document.querySelector('.chat-container');
    const chatHeader = document.querySelector('.chat-header');
    const apiSettings = document.getElementById('api_settings');
    const chatMessages = document.getElementById('chat_messages');
    
    // 确保API设置面板默认折叠
    apiSettings.classList.remove('show');
    console.log('API设置面板默认折叠');
    
    // 修改chat-header为只包含标题
    chatHeader.innerHTML = '<span>AI思维导图助手</span>';
    
    // 创建控制区域，插入到chat-header后面，api_settings前面
    const topControls = document.createElement('div');
    topControls.className = 'chat-top-controls';
    
    // 添加新建对话按钮
    const newConversationBtn = document.createElement('button');
    newConversationBtn.id = 'new_conversation';
    newConversationBtn.textContent = '新对话';
    newConversationBtn.title = '清除当前对话，开始新对话';
    topControls.appendChild(newConversationBtn);
    
    // 添加AI助手开关按钮
    const aiToggleBtn = document.createElement('button');
    aiToggleBtn.id = 'ai_toggle';
    aiToggleBtn.textContent = '开启AI助手';
    aiToggleBtn.title = '开启/关闭AI助手自动响应';
    aiToggleBtn.style.backgroundColor = '#4CAF50'; // 默认绿色(开启状态)
    topControls.appendChild(aiToggleBtn);
    
    // 添加设置按钮到控制区域
    const settingsToggle = document.createElement('button');
    settingsToggle.id = 'settings_toggle';
    settingsToggle.textContent = '⚙️ 设置';
    settingsToggle.title = '打开/关闭API设置';
    topControls.appendChild(settingsToggle);
    
    // 将控制区域插入到chat-header之后，api_settings之前
    chatContainer.insertBefore(topControls, apiSettings);
    
    // 新建对话按钮事件监听
    newConversationBtn.addEventListener('click', function() {
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
    
    // AI助手开关事件监听
    aiToggleBtn.addEventListener('click', function() {
        toggleAIAssistant();
        this.textContent = aiAssistantEnabled ? '关闭AI助手' : '开启AI助手';
        this.style.backgroundColor = aiAssistantEnabled ? '#f44336' : '#4CAF50';
    });
    
    // 设置按钮事件监听
    settingsToggle.addEventListener('click', function() {
        const settingsPanel = document.getElementById('api_settings');
        settingsPanel.classList.toggle('show');
    });
    
    console.log('聊天界面初始化完成，控制区域在chat-header下方，设置窗口默认关闭');
}

// 修改发送消息函数
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

// 修改添加消息函数，支持显示思维导图修改建议
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

// 新增函数：获取完整思维导图结构
function getMindmapStructure() {
    console.log('正在获取完整思维导图结构...');
    try {
        // 获取整个思维导图数据
        const mindData = jm.get_data();
        console.log('思维导图完整数据:', mindData);
        
        // 获取所有节点信息
        const allNodes = [];
        if (jm.mind && jm.mind.nodes) {
            for (const id in jm.mind.nodes) {
                const node = jm.mind.nodes[id];
                if (node) {
                    allNodes.push({
                        id: node.id,
                        topic: node.topic || '未命名节点',
                        isRoot: node.isroot,
                        parentId: node.parent ? node.parent.id : null
                    });
                }
            }
        }
        
        // 获取选中节点
        const selectedNodeInfo = selectedNode ? {
            id: selectedNode.id,
            topic: selectedNode.topic || '未命名节点',
            isRoot: selectedNode.isroot
        } : null;
        
        console.log('所有节点信息:', allNodes);
        console.log('选中节点信息:', selectedNodeInfo);
        
        return {
            allNodes: allNodes,
            selectedNode: selectedNodeInfo
        };
    } catch (error) {
        console.error('获取思维导图结构失败:', error);
        return {
            allNodes: [],
            selectedNode: null,
            error: error.message
        };
    }
}

// 修改处理AI请求函数，改进思维导图修改逻辑
async function processAIRequest(query) {
    const aiService = document.getElementById('ai_service').value;
    const apiKey = document.getElementById('api_key').value;
    
    if (!apiKey) {
        addMessage('ai', '请先点击右上角设置，输入API密钥。');
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

// 改进提取建议函数，更详细的格式检测
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

// 从文本中移除建议的辅助函数
function removeSuggestionsFromText(text) {
    return text.replace(/(?:添加子节点|修改当前节点|添加兄弟节点)[:：]\s*.+?(?:\n|$)/g, '');
}

// 修改OpenAI调用函数，支持对话历史
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
            ...history,
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

// 修改Deepseek调用函数，支持对话历史
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
            ...history,
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

// 确保toggleAIAssistant函数正确实现
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
            if (!window.toolbarInitialized) {
                initToolbar();
                window.toolbarInitialized = true;
            }
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

// 向HTML文件中添加新的对话框和相关样式
function addStylesAndDialogs() {
    // 添加新的样式
    const styleEl = document.createElement('style');
    styleEl.textContent = `
        /* 节点样式编辑器 */
        .style-editor {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 320px;
            background: white;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
            border-radius: 8px;
            z-index: 1000;
            overflow: hidden;
            display: none;
        }
        
        .editor-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 15px;
            border-bottom: 1px solid #eee;
        }
        
        .editor-header h3 {
            margin: 0;
            font-size: 16px;
        }
        
        .editor-close {
            cursor: pointer;
            font-size: 20px;
        }
        
        .editor-content {
            padding: 15px;
            max-height: 70vh;
            overflow-y: auto;
        }
        
        .editor-section {
            margin-bottom: 20px;
        }
        
        .editor-section h4 {
            margin: 0 0 10px 0;
            font-size: 14px;
            color: #333;
        }
        
        .form-row {
            display: flex;
            align-items: center;
            margin-bottom: 10px;
        }
        
        .form-row label {
            width: 70px;
            font-size: 14px;
        }
        
        .form-row select, .form-row input {
            flex: 1;
            padding: 6px 8px;
            border: 1px solid #ddd;
            border-radius: 4px;
        }
        
        .form-row .color-picker {
            width: 100%;
            height: 40px;
            border: 1px solid #ddd;
            border-radius: 4px;
            cursor: pointer;
        }
        
        .button-row {
            display: flex;
            justify-content: flex-end;
            padding: 12px 15px;
            border-top: 1px solid #eee;
        }
        
        .button-row button {
            padding: 6px 15px;
            border: none;
            border-radius: 4px;
            margin-left: 10px;
            cursor: pointer;
        }
        
        .button-row .cancel {
            background: #f5f5f5;
            color: #333;
        }
        
        .button-row .apply {
            background: #4CAF50;
            color: white;
        }
        
        /* 关联线样式 */
        .relation-line {
            stroke: #2196F3;
            stroke-width: 1.5px;
            stroke-dasharray: 5,3;
            fill: none;
        }
        
        /* 有备注的节点标记 */
        .has-note {
            position: absolute;
            top: -6px;
            right: -6px;
            width: 12px;
            height: 12px;
            background: #ff9800;
            border-radius: 50%;
        }
        
        /* LaTeX公式样式 */
        .latex-formula {
            padding: 2px 4px;
            background: rgba(240,240,240,0.5);
            border-radius: 2px;
        }
        
        /* 摘要样式 */
        .node-summary {
            font-size: 12px;
            color: #777;
            font-style: italic;
            margin-top: 2px;
        }
        
        /* 侧边编辑器样式 */
        .sidebar-editor {
            position: fixed;
            top: 0;
            right: -350px; /* 默认隐藏在右侧 */
            width: 350px;
            height: 100vh;
            background: white;
            box-shadow: -2px 0 10px rgba(0,0,0,0.2);
            z-index: 1000;
            transition: right 0.3s ease;
            display: flex;
            flex-direction: column;
            overflow: hidden;
        }
        
        .sidebar-editor.show {
            right: 0;
        }
        
        .sidebar-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 15px;
            border-bottom: 1px solid #eee;
            background: #f9f9f9;
        }
        
        .sidebar-header h3 {
            margin: 0;
            font-size: 18px;
            color: #333;
        }
        
        .sidebar-close {
            cursor: pointer;
            font-size: 20px;
            color: #666;
        }
        
        .sidebar-content {
            flex: 1;
            padding: 15px;
            overflow-y: auto;
        }
        
        .latex-input {
            width: 100%;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 14px;
            min-height: 80px;
            margin-bottom: 15px;
            font-family: monospace;
            resize: vertical;
        }
        
        .complete-button {
            width: 100%;
            padding: 10px;
            background: #4CAF50;
            color: white;
            border: none;
            border-radius: 4px;
            font-size: 16px;
            cursor: pointer;
            margin-bottom: 20px;
        }
        
        .complete-button:hover {
            background: #45a049;
        }
        
        .common-formulas-title {
            font-size: 16px;
            font-weight: bold;
            margin: 20px 0 15px 0;
            color: #333;
        }
        
        .formula-table {
            width: 100%;
            border-collapse: collapse;
        }
        
        .formula-table td {
            padding: 8px;
            border: 1px solid #eee;
            text-align: center;
        }
        
        .formula-table td:first-child {
            width: 50%;
        }
        
        .formula-table td:hover {
            background: #f5f5f5;
            cursor: pointer;
        }
        
        .preview-area {
            margin: 15px 0;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 4px;
            min-height: 60px;
            display: flex;
            justify-content: center;
            align-items: center;
            background: #f9f9f9;
        }
    `;
    document.head.appendChild(styleEl);
    
    // 创建侧边LaTeX编辑器
    const latexSidebar = document.createElement('div');
    latexSidebar.className = 'sidebar-editor';
    latexSidebar.id = 'latex_sidebar';
    latexSidebar.innerHTML = `
        <div class="sidebar-header">
            <h3>公式</h3>
            <span class="sidebar-close">&times;</span>
        </div>
        <div class="sidebar-content">
            <textarea class="latex-input" id="sidebar_latex_formula" placeholder="请输入LaTeX语法"></textarea>
            
            <div class="preview-area" id="sidebar_latex_preview"></div>
            
            <button class="complete-button" id="sidebar_latex_apply">完成</button>
            
            <div class="common-formulas-title">常用公式</div>
            <table class="formula-table">
                <tr>
                    <td><span>a^2</span></td>
                    <td><code>a^2</code></td>
                </tr>
                <tr>
                    <td><span>a_2</span></td>
                    <td><code>a_2</code></td>
                </tr>
                <tr>
                    <td><span>a^2 + 2</span></td>
                    <td><code>a^{2+2}</code></td>
                </tr>
                <tr>
                    <td><span>a_{i,j}</span></td>
                    <td><code>a_{i,j}</code></td>
                </tr>
                <tr>
                    <td><span>x_2^3</span></td>
                    <td><code>x_2^3</code></td>
                </tr>
                <tr>
                    <td><span>\overline{1 + 2 + \cdots + 100}</span></td>
                    <td><code>\overline{1+2+\cdots+100}</code></td>
                </tr>
                <tr>
                    <td><span>\sum_{k=1}^N k^2</span></td>
                    <td><code>\sum_{k=1}^N k^2</code></td>
                </tr>
                <tr>
                    <td><span>\lim_{n \to \infty}x_n</span></td>
                    <td><code>\lim_{n \to \infty}x_n</code></td>
                </tr>
                <tr>
                    <td><span>\int_{-N}^{N} e^x dx</span></td>
                    <td><code>\int_{-N}^{N} e^x dx</code></td>
                </tr>
                <tr>
                    <td><span>\sqrt{3}</span></td>
                    <td><code>\sqrt{3}</code></td>
                </tr>
            </table>
        </div>
    `;
    document.body.appendChild(latexSidebar);
    
    // 继续保留原来的对话框元素，但我们不会使用它们
    
    // 加载KaTeX库用于渲染LaTeX公式
    if (!document.querySelector('script[src*="katex"]')) {
        const katexScript = document.createElement('script');
        katexScript.src = 'https://cdn.jsdelivr.net/npm/katex@0.16.4/dist/katex.min.js';
        document.head.appendChild(katexScript);
        
        const katexCSS = document.createElement('link');
        katexCSS.rel = 'stylesheet';
        katexCSS.href = 'https://cdn.jsdelivr.net/npm/katex@0.16.4/dist/katex.min.css';
        document.head.appendChild(katexCSS);
    }
    
    console.log('添加了侧边编辑器和样式元素');
}

// LaTeX公式编辑器相关功能
function openLatexEditor() {
    if (!selectedNode) {
        alert('请先选择一个节点');
        return;
    }
    
    console.log('打开LaTeX侧边编辑器');
    const sidebar = document.getElementById('latex_sidebar');
    const formula = document.getElementById('sidebar_latex_formula');
    const preview = document.getElementById('sidebar_latex_preview');
    
    // 获取当前节点的公式（如果有）
    const currentFormula = selectedNode.data && selectedNode.data.latex ? selectedNode.data.latex : '';
    formula.value = currentFormula;
    
    // 实时预览
    formula.addEventListener('input', updateSidebarLatexPreview);
    
    // 常用公式点击事件
    const formulaCells = sidebar.querySelectorAll('.formula-table td');
    formulaCells.forEach(cell => {
        cell.addEventListener('click', function() {
            const code = this.querySelector('code');
            if (code) {
                formula.value += code.textContent;
                updateSidebarLatexPreview();
            }
        });
    });
    
    // 关闭按钮事件
    sidebar.querySelector('.sidebar-close').addEventListener('click', function() {
        sidebar.classList.remove('show');
    });
    
    // 完成按钮事件
    document.getElementById('sidebar_latex_apply').onclick = function() {
        applyLatexFormula(formula.value);
        sidebar.classList.remove('show');
    };
    
    console.log('样式和对话框添加完成');
}

// 添加侧边栏LaTeX预览函数
function updateSidebarLatexPreview() {
    const formula = document.getElementById('sidebar_latex_formula').value;
    const preview = document.getElementById('sidebar_latex_preview');
    
    try {
        if (window.katex && formula.trim()) {
            katex.render(formula, preview, {
                throwOnError: false,
                displayMode: true
            });
        } else {
            preview.textContent = formula ? '加载KaTeX中...' : '无预览';
        }
    } catch (e) {
        preview.textContent = '公式渲染错误: ' + e.message;
    }
}

// 更新applyLatexFormula，确保其正确应用到选中节点
function applyLatexFormula(formula) {
    if (!selectedNode) return;
    
    try {
        // 更新节点的数据
        if (!selectedNode.data) selectedNode.data = {};
        selectedNode.data.latex = formula;
        
        // 更新显示
        if (formula) {
            // 在节点上添加公式标记
            const displayText = selectedNode.topic.replace(/ \[公式\]$/, '') + ' [公式]';
            jm.update_node(selectedNode.id, displayText);
            
            // 添加公式图标或指示器
            const nodeElement = document.querySelector(`jmnode[nodeid="${selectedNode.id}"]`);
            if (nodeElement) {
                if (!nodeElement.querySelector('.formula-indicator')) {
                    const indicator = document.createElement('div');
                    indicator.className = 'formula-indicator';
                    indicator.style.position = 'absolute';
                    indicator.style.bottom = '-5px';
                    indicator.style.right = '-5px';
                    indicator.style.width = '10px';
                    indicator.style.height = '10px';
                    indicator.style.borderRadius = '50%';
                    indicator.style.backgroundColor = '#9c27b0';
                    nodeElement.appendChild(indicator);
                }
            }
        } else {
            // 如果公式为空，移除标记
            const displayText = selectedNode.topic.replace(/ \[公式\]$/, '');
            jm.update_node(selectedNode.id, displayText);
            
            // 移除公式图标
            const nodeElement = document.querySelector(`jmnode[nodeid="${selectedNode.id}"]`);
            if (nodeElement) {
                const indicator = nodeElement.querySelector('.formula-indicator');
                if (indicator) indicator.remove();
            }
        }
        
        console.log('应用公式到节点:', selectedNode.id, formula);
    } catch (e) {
        console.error('应用LaTeX公式失败:', e);
        alert('应用公式失败: ' + e.message);
    }
}

// 在点击节点时显示完整公式（如果有的话）
function showNodeFormula(node) {
    if (node && node.data && node.data.latex) {
        const formula = node.data.latex;
        
        // 创建一个临时的显示区域
        const display = document.createElement('div');
        display.className = 'formula-display';
        display.style.position = 'fixed';
        display.style.top = '50%';
        display.style.left = '50%';
        display.style.transform = 'translate(-50%, -50%)';
        display.style.backgroundColor = 'white';
        display.style.padding = '20px';
        display.style.borderRadius = '8px';
        display.style.boxShadow = '0 0 15px rgba(0,0,0,0.3)';
        display.style.zIndex = '2000';
        display.style.maxWidth = '80%';
        
        // 渲染公式
        if (window.katex) {
            katex.render(formula, display, {
                throwOnError: false,
                displayMode: true
            });
        } else {
            display.textContent = formula;
        }
        
        // 添加关闭按钮
        const close = document.createElement('div');
        close.textContent = '×';
        close.style.position = 'absolute';
        close.style.top = '5px';
        close.style.right = '10px';
        close.style.cursor = 'pointer';
        close.style.fontSize = '20px';
        close.onclick = function() {
            document.body.removeChild(display);
        };
        
        display.appendChild(close);
        document.body.appendChild(display);
        
        // 点击其他区域关闭
        document.addEventListener('click', function closeFormula(e) {
            if (!display.contains(e.target)) {
                document.body.removeChild(display);
                document.removeEventListener('click', closeFormula);
            }
        });
    }
}

// 修改选择节点的事件处理函数，添加点击公式节点查看公式的功能
jm.add_event_listener(function(type, data) {
    if (type === jsMind.event_type.select) {
        if (data && data.node) {
            selectedNode = data.node;
            
            // 检查是否是双击
            const now = Date.now();
            if (selectedNode._lastClickTime && now - selectedNode._lastClickTime < 300) {
                // 是双击，且节点有公式
                if (selectedNode.data && selectedNode.data.latex) {
                    showNodeFormula(selectedNode);
                }
            }
            selectedNode._lastClickTime = now;
            
            // 其他原有逻辑...
        }
    }
});

// 备注功能相关
function openNoteEditor() {
    if (!selectedNode) {
        alert('请先选择一个节点');
        return;
    }
    
    console.log('打开备注编辑器');
    const editor = document.getElementById('note_editor');
    const noteInput = document.getElementById('node_note');
    
    // 获取当前节点的备注（如果有）
    const currentNote = nodeNotes[selectedNode.id] || '';
    noteInput.value = currentNote;
    
    // 应用按钮事件
    document.getElementById('note_apply').onclick = function() {
        applyNodeNote(noteInput.value);
        editor.style.display = 'none';
    };
    
    // 显示编辑器
    editor.style.display = 'block';
}

function applyNodeNote(note) {
    if (!selectedNode) return;
    
    try {
        // 保存备注
        if (note.trim()) {
            nodeNotes[selectedNode.id] = note;
            
            // 添加备注标记到节点
            addNoteMarker(selectedNode);
        } else {
            // 如果备注为空，则删除
            delete nodeNotes[selectedNode.id];
            removeNoteMarker(selectedNode);
        }
        
        console.log('应用备注到节点:', selectedNode.id, note);
    } catch (e) {
        console.error('应用节点备注失败:', e);
        alert('应用备注失败: ' + e.message);
    }
}

function addNoteMarker(node) {
    // 实际实现可能会更复杂，涉及DOM操作
    try {
        const nodeElement = document.querySelector(`jmnode[nodeid="${node.id}"]`);
        if (nodeElement) {
            // 检查是否已有标记
            if (!nodeElement.querySelector('.has-note')) {
                const marker = document.createElement('div');
                marker.className = 'has-note';
                marker.title = '查看备注';
                marker.onclick = function(e) {
                    e.stopPropagation();
                    showNodeNote(node.id);
                };
                nodeElement.appendChild(marker);
            }
        }
    } catch (e) {
        console.error('添加备注标记失败:', e);
    }
}

function removeNoteMarker(node) {
    try {
        const marker = document.querySelector(`jmnode[nodeid="${node.id}"] .has-note`);
        if (marker) marker.remove();
    } catch (e) {
        console.error('移除备注标记失败:', e);
    }
}

function showNodeNote(nodeId) {
    const note = nodeNotes[nodeId];
    if (note) {
        alert('节点备注:\n' + note);
    }
}

// 关联线功能
let relationStartNode = null;

function startRelationLine() {
    if (!selectedNode) {
        alert('请先选择一个起始节点');
        return;
    }
    
    if (relationStartNode) {
        // 如果已经选择了起始节点，重置
        relationStartNode = null;
        alert('已重置关联线选择');
    } else {
        // 设置起始节点
        relationStartNode = selectedNode;
        alert(`已选择起始节点: "${relationStartNode.topic}"\n现在请选择目标节点`);
        
        // 添加一次性事件监听器
        const originalEventListener = jm._listeners[jsMind.event_type.select][0];
        
        jm._listeners[jsMind.event_type.select][0] = function(type, data) {
            // 首先执行原始监听器
            originalEventListener(type, data);
            
            // 如果有起始节点且选择了新节点
            if (relationStartNode && data.node && data.node.id !== relationStartNode.id) {
                completeRelationLine(data.node);
                // 恢复原始监听器
                jm._listeners[jsMind.event_type.select][0] = originalEventListener;
            }
        };
    }
}

function completeRelationLine(endNode) {
    if (!relationStartNode || !endNode) return;
    
    try {
        // 创建关联线信息
        const relationInfo = {
            from: relationStartNode.id,
            to: endNode.id,
            label: '关联'
        };
        
        // 保存关联线信息
        relationLines.push(relationInfo);
        
        // 绘制关联线
        drawRelationLine(relationInfo);
        
        console.log('创建关联线:', relationInfo);
        alert(`已创建从"${relationStartNode.topic}"到"${endNode.topic}"的关联线`);
        
        // 重置起始节点
        relationStartNode = null;
    } catch (e) {
        console.error('创建关联线失败:', e);
        alert('创建关联线失败: ' + e.message);
        relationStartNode = null;
    }
}

function drawRelationLine(relationInfo) {
    // 获取SVG容器
    let svg = document.getElementById('relation_lines_svg');
    if (!svg) {
        // 创建SVG容器
        svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.id = 'relation_lines_svg';
        svg.style.position = 'absolute';
        svg.style.top = '0';
        svg.style.left = '0';
        svg.style.width = '100%';
        svg.style.height = '100%';
        svg.style.pointerEvents = 'none';
        svg.style.zIndex = '5';
        document.getElementById('jsmind_container').appendChild(svg);
    }
    
    // 获取节点位置
    const fromNode = document.querySelector(`jmnode[nodeid="${relationInfo.from}"]`);
    const toNode = document.querySelector(`jmnode[nodeid="${relationInfo.to}"]`);
    
    if (!fromNode || !toNode) return;
    
    // 计算线的起点和终点
    const fromRect = fromNode.getBoundingClientRect();
    const toRect = toNode.getBoundingClientRect();
    const containerRect = document.getElementById('jsmind_container').getBoundingClientRect();
    
    const x1 = fromRect.left + fromRect.width/2 - containerRect.left;
    const y1 = fromRect.top + fromRect.height/2 - containerRect.top;
    const x2 = toRect.left + toRect.width/2 - containerRect.left;
    const y2 = toRect.top + toRect.height/2 - containerRect.top;
    
    // 创建线元素
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    line.setAttribute('class', 'relation-line');
    line.setAttribute('d', `M${x1},${y1} C${(x1+x2)/2},${y1} ${(x1+x2)/2},${y2} ${x2},${y2}`);
    line.setAttribute('data-from', relationInfo.from);
    line.setAttribute('data-to', relationInfo.to);
    
    // 添加标签
    const textX = (x1 + x2) / 2;
    const textY = (y1 + y2) / 2 - 10;
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', textX);
    text.setAttribute('y', textY);
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('fill', '#2196F3');
    text.setAttribute('font-size', '12px');
    text.textContent = relationInfo.label;
    
    // 添加到SVG
    svg.appendChild(line);
    svg.appendChild(text);
}

// 更新所有关联线位置
function updateRelationLines() {
    // 移除旧的关联线
    const svg = document.getElementById('relation_lines_svg');
    if (svg) svg.innerHTML = '';
    
    // 重新绘制所有关联线
    relationLines.forEach(drawRelationLine);
}

// 需要在jsMind视图变化时更新关联线
jm.add_event_listener(function(type, data) {
    if (type === jsMind.event_type.resize || 
        type === jsMind.event_type.show) {
        // 延迟执行，确保节点位置已更新
        setTimeout(updateRelationLines, 100);
    }
});

// 摘要功能
function openSummaryEditor() {
    if (!selectedNode) {
        alert('请先选择一个节点');
        return;
    }
    
    console.log('打开摘要编辑器');
    const editor = document.getElementById('summary_editor');
    const summaryInput = document.getElementById('node_summary');
    
    // 获取当前节点的摘要（如果有）
    const currentSummary = nodeSummaries[selectedNode.id] || '';
    summaryInput.value = currentSummary;
    
    // 应用按钮事件
    document.getElementById('summary_apply').onclick = function() {
        applyNodeSummary(summaryInput.value);
        editor.style.display = 'none';
    };
    
    // 显示编辑器
    editor.style.display = 'block';
}

function applyNodeSummary(summary) {
    if (!selectedNode) return;
    
    try {
        // 保存摘要
        if (summary.trim()) {
            nodeSummaries[selectedNode.id] = summary;
            // 添加摘要显示
            addSummaryDisplay(selectedNode, summary);
        } else {
            // 如果摘要为空，则删除
            delete nodeSummaries[selectedNode.id];
            removeSummaryDisplay(selectedNode);
        }
        
        console.log('应用摘要到节点:', selectedNode.id, summary);
    } catch (e) {
        console.error('应用节点摘要失败:', e);
        alert('应用摘要失败: ' + e.message);
    }
}

function addSummaryDisplay(node, summary) {
    try {
        const nodeElement = document.querySelector(`jmnode[nodeid="${node.id}"]`);
        if (nodeElement) {
            // 删除已有摘要
            removeSummaryDisplay(node);
            
            // 添加摘要显示
            const summaryEl = document.createElement('div');
            summaryEl.className = 'node-summary';
            summaryEl.textContent = summary;
            nodeElement.appendChild(summaryEl);
        }
    } catch (e) {
        console.error('添加摘要显示失败:', e);
    }
}

function removeSummaryDisplay(node) {
    try {
        const summaryEl = document.querySelector(`jmnode[nodeid="${node.id}"] .node-summary`);
        if (summaryEl) summaryEl.remove();
    } catch (e) {
        console.error('移除摘要显示失败:', e);
    }
}

// 导出为Markdown功能
function exportToMarkdown() {
    try {
        console.log('开始导出为Markdown格式');
        
        // 获取思维导图数据
        const mindData = jm.get_data();
        if (!mindData || !mindData.data) {
            alert('思维导图数据为空，无法导出');
            return;
        }
        
        // 生成Markdown文本
        let markdown = `# ${mindData.data.topic || '思维导图'}\n\n`;
        
        // 使用递归函数处理节点
        function processNode(node, level = 1) {
            if (!node) return '';
            
            let result = '';
            
            // 添加节点标题
            const prefix = '#'.repeat(Math.min(level, 6)) + ' ';
            result += prefix + node.topic + '\n\n';
            
            // 添加LaTeX公式（如果有）
            if (node.data && node.data.latex) {
                result += '$$\n' + node.data.latex + '\n$$\n\n';
            }
            
            // 添加摘要（如果有）
            if (nodeSummaries[node.id]) {
                result += '*' + nodeSummaries[node.id] + '*\n\n';
            }
            
            // 添加备注（如果有）
            if (nodeNotes[node.id]) {
                result += '> ' + nodeNotes[node.id].replace(/\n/g, '\n> ') + '\n\n';
            }
            
            // 处理子节点
            if (node.children && node.children.length > 0) {
                node.children.forEach(child => {
                    result += processNode(child, level + 1);
                });
            }
            
            return result;
        }
        
        // 获取根节点
        const rootNode = mindData.data;
        markdown += processNode(rootNode);
        
        // 添加关联线信息
        if (relationLines.length > 0) {
            markdown += '## 节点关联\n\n';
            relationLines.forEach(relation => {
                const fromNode = jm.get_node(relation.from);
                const toNode = jm.get_node(relation.to);
                if (fromNode && toNode) {
                    markdown += `- ${fromNode.topic} → ${toNode.topic}\n`;
                }
            });
            markdown += '\n';
        }
        
        // 创建下载链接
        downloadMarkdown(markdown, mindData.data.topic || 'mindmap');
        
    } catch (e) {
        console.error('导出Markdown失败:', e);
        alert('导出失败: ' + e.message);
    }
}

function downloadMarkdown(content, filename) {
    // 创建Blob对象
    const blob = new Blob([content], { type: 'text/markdown' });
    
    // 创建URL
    const url = URL.createObjectURL(blob);
    
    // 创建下载链接
    const a = document.createElement('a');
    a.href = url;
    a.download = filename + '.md';
    
    // 添加到文档并点击
    document.body.appendChild(a);
    a.click();
    
    // 清理
    setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, 100);
    
    alert('Markdown导出成功！');
}

// 添加JSON保存函数
function saveAsJson() {
    try {
        const data = jm.get_data();
        const json = JSON.stringify(data);
        const blob = new Blob([json], {type: "application/json"});
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = 'mindmap.json';
        document.body.appendChild(a);
        a.click();
        
        setTimeout(function() {
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        }, 0);
        
        console.log('成功保存为JSON格式');
    } catch (e) {
        console.error('保存JSON失败:', e);
        alert('保存失败: ' + e.message);
    }
}

// 加载思维导图函数
function loadMindMap() {
    try {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json,.md';
        
        input.onchange = function(e) {
            const file = e.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = function(event) {
                const content = event.target.result;
                
                if (file.name.endsWith('.json')) {
                    // 加载JSON格式
                    try {
                        const data = JSON.parse(content);
                        jm.show(data);
                        console.log('已加载JSON格式思维导图');
                    } catch (err) {
                        alert('JSON格式无效: ' + err.message);
                    }
                } else if (file.name.endsWith('.md')) {
                    // TODO: 实现Markdown导入功能
                    alert('Markdown导入功能尚未实现');
                }
            };
            
            reader.readAsText(file);
        };
        
        input.click();
    } catch (e) {
        console.error('加载失败:', e);
        alert('加载失败: ' + e.message);
    }
}

// 确保在DOM准备好后初始化功能
document.addEventListener('DOMContentLoaded', function() {
    // 添加功能对话框并加载所需资源
    addStylesAndDialogs();
    
    // 现有的初始化代码...
}); 