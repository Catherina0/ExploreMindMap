// 全局变量 - 核心
let jm = null;  // jsMind实例
let selectedNode = null;  // 当前选中的节点
let nodeIdCounter = 0;  // 节点ID计数器
let zoomLevel = 100;  // 当前缩放级别

// 全局变量 - AI相关
let aiAssistantEnabled = false;  // AI助手启用状态
let conversationHistory = [];  // 对话历史
let isFirstQuery = true;  // 是否是首次查询

 
// 捕获并处理资源加载错误
window.addEventListener('error', function(e) {
    // 检查错误是否来自Chrome扩展
    if (e && e.target && e.target.src && e.target.src.indexOf('chrome-extension://') !== -1) {
        // 阻止错误冒泡
        e.stopPropagation();
        // 阻止默认处理
        e.preventDefault();
        console.log('已屏蔽Chrome扩展相关错误:', e.target.src);
        return true;
    }
}, true); // 使用捕获阶段

// 页面初始化 - 使用window.onload确保所有资源都加载完成
window.onload = function() {
    console.log('页面完全加载完成，开始初始化应用');
    
    // 初始化jsMind
    initJsMind();
    
    // 确保FontAwesome图标库已加载
    ensureFontAwesomeLoaded(() => {
        console.log('FontAwesome图标库已加载');
        
        // 延迟初始化其他组件，确保jsMind完全初始化或处理依赖问题
        setTimeout(function() {
            console.log('初始化其他组件...');
            
            // 初始化工具栏 (会重建工具栏DOM)
            console.log('调用initToolbar...', typeof initToolbar);
            if (typeof initToolbar === 'function') {
                try {
                    console.log('开始初始化工具栏');
                    if (!window.toolbarInitialized) {
                        initToolbar();
                        window.toolbarInitialized = true;
                        console.log('工具栏初始化成功');
                    } else {
                        console.log('工具栏已经初始化过，跳过');
                    }
                } catch (e) {
                    console.error('初始化工具栏出错:', e);
                }
            } else {
                console.warn('initToolbar函数未定义，全局对象:', Object.keys(window).filter(k => k.includes('init')));
            }
            
            // 初始化缩放控制器
            if (typeof initZoomController === 'function') {
                initZoomController();
            } else {
                console.warn('initZoomController函数未定义');
            }
            
            // 初始化侧边栏
            setupSidebars();
            
            // 设置DOM观察器
            setupDOMObserver();
            
            // 设置节点监控
            const stopNodeMonitor = setupNodeMonitor();
            
            // 初始化聊天界面
            if (typeof initChat === 'function') {
                initChat();
            } else {
                console.warn('initChat函数未定义');
            }
            
            // 在initToolbar之后设置下拉菜单，因为它依赖于initToolbar创建的元素
            setupDropdownMenus();
            
            // 确保i18n已经被应用到所有已经初始化的元素
            if (window.i18n && typeof window.i18n.updateAllTexts === 'function') {
                window.i18n.updateAllTexts();
            }
            
            console.log('应用初始化完成');
        }, 1000); // 保持你设置的延迟
    });
};

// 确保FontAwesome图标库已完全加载
function ensureFontAwesomeLoaded(callback) {
    // 检查是否可以使用FontAwesome图标
    const testIcon = document.createElement('i');
    testIcon.className = 'fas fa-check';
    testIcon.style.display = 'none';
    document.body.appendChild(testIcon);
    
    // 获取计算后的样式
    const computedStyle = window.getComputedStyle(testIcon);
    const fontFamily = computedStyle.getPropertyValue('font-family');
    
    document.body.removeChild(testIcon);
    
    // 如果字体族包含"Font Awesome"，则认为已加载
    if (fontFamily.includes('Font Awesome') || fontFamily.includes('FontAwesome')) {
        console.log('FontAwesome已加载，直接继续');
        callback();
    } else {
        console.log('等待FontAwesome加载...');
        // 尝试等待FontAwesome加载
        setTimeout(() => {
            console.log('FontAwesome加载超时，继续初始化');
            callback();
        }, 500);
    }
}

// 生成唯一ID
function generateUniqueID() {
    return 'node_' + (nodeIdCounter++);
}

// 初始化jsMind
function initJsMind() {
    console.log('初始化jsMind...');
    
    try {
        // 显示加载指示器
        const loadingIndicator = document.getElementById('loading');
        if (loadingIndicator) {
            loadingIndicator.style.display = 'block';
        }
        
        // 检查容器是否存在
        const container = document.getElementById('jsmind_container');
        if (!container) {
            console.error('找不到jsMind容器元素');
            return;
        }
        
        // 基本配置
        const options = {
            container: 'jsmind_container',
            theme: 'primary',
            editable: true,
            mode: 'full',
            support_html: true,
            view: {
                engine: 'canvas',
                hmargin: 100,
                vmargin: 50,
                line_width: 2,
                line_color: '#555',
                draggable: true,
                hide_scrollbars_when_draggable: true
            }
        };
        
        // 获取适合当前语言的根节点名称
        const rootNodeText = window.i18n && typeof window.i18n.t === 'function' ? 
            window.i18n.t('root_node') : '根节点';
        
        // 默认数据
        const defaultData = {
            meta: {
                name: window.i18n && typeof window.i18n.t === 'function' ? 
                    window.i18n.t('app_title') : 'AI思维导图',
                author: 'AI助手',
                version: '1.0'
            },
            format: 'node_tree',
            data: {
                id: 'root',
                topic: rootNodeText,
                direction: 'right',
                expanded: true,
                children: []
            }
        };
        
        console.log('创建jsMind实例...');
        
        // 创建jsMind实例
        try {
            jm = new jsMind(options);
            console.log('jsMind实例创建成功');
        } catch (e) {
            console.error('创建jsMind实例失败:', e);
            return;
        }
        
        console.log('调用jm.show显示思维导图...');
        try {
            jm.show(defaultData);
            console.log('思维导图显示成功');
        } catch (e) {
            console.error('显示思维导图失败:', e);
            return;
        }
        
        // 隐藏加载指示器
        if (loadingIndicator) {
            loadingIndicator.style.display = 'none';
        }
        
        console.log('jsMind初始化成功');
        
        // 确保根节点居中显示并可见
        setTimeout(function() {
            if (jm && jm.view) {
                console.log('使根节点居中显示');
                jm.view.center_node(jm.mind.root);
                jm.view.show();
                
                // 检查根节点是否可见
                const rootElement = document.querySelector('jmnode[nodeid="root"]');
                if (rootElement) {
                    console.log('根节点元素已找到并可见');
                } else {
                    console.warn('找不到根节点元素，可能未正确渲染');
                }
            } else {
                console.warn('jm.view未定义，无法居中根节点');
            }
        }, 500);
        
        // 添加节点选择事件
        jm.add_event_listener(function(type, data) {
            if (type === jsMind.event_type.select) {
                console.group('[节点选择事件]');
                try {
                    // 增加对data参数的详细检查
                    console.log('收到事件数据:', data);
                    
                    if (!data) {
                        console.warn('事件数据为空');
                        console.groupEnd();
                        return;
                    }
                    
                    if (!data.node) {
                        console.warn('事件数据中没有node属性');
                        console.log('完整事件数据:', JSON.stringify(data));
                        console.groupEnd();
                        return;
                    }
                    
                    // 如果node是字符串（如'root'），从jsMind中获取完整节点对象
                    let nodeObj = data.node;
                    if (typeof data.node === 'string') {
                        console.log('节点数据是字符串ID:', data.node);
                        nodeObj = jm.get_node(data.node);
                        if (!nodeObj) {
                            console.warn('无法从ID获取节点对象:', data.node);
                            console.groupEnd();
                            return;
                        }
                        console.log('已获取节点对象:', nodeObj.id);
                    }
                    
                    // 确保获取的节点存在于jsMind中
                    const nodeExists = nodeObj.id ? jm.get_node(nodeObj.id) : null;
                    if (!nodeExists) {
                        console.warn('所选节点在jsMind中不存在:', nodeObj.id);
                        // 不更新selectedNode，保持之前的选择或设为null
                        selectedNode = null;
                        console.groupEnd();
                        return;
                    }
                    
                    // 验证节点数据完整性
                    const validNode = {
                        id: nodeObj.id || `node_${Date.now()}`,
                        topic: nodeObj.topic || '未命名节点',
                        data: nodeObj.data || {},
                        parent: nodeObj.parent,
                        children: nodeObj.children || []
                    };
                    
                    // 检查ID是否是字符串类型，如果不是，转换为字符串
                    if (typeof validNode.id !== 'string') {
                        console.warn('节点ID不是字符串类型:', validNode.id);
                        validNode.id = String(validNode.id);
                    }
                    
                    console.log('有效节点数据:', {
                        id: validNode.id,
                        topic: validNode.topic,
                        parent: validNode.parent ? validNode.parent.id : 'none',
                        children: validNode.children.length || 0
                    });
                    
                    // 设置选中节点 - 使用验证后的数据
                    selectedNode = {
                        ...nodeObj,
                        id: validNode.id,
                        topic: validNode.topic,
                        data: validNode.data
                    };
                    
                    console.log('选中节点:', selectedNode.id, selectedNode.topic);
                    
                    // 检查是否是双击
                    const now = Date.now();
                    if (selectedNode._lastClickTime && now - selectedNode._lastClickTime < 300) {
                        console.log('检测到双击事件');
                        // 是双击且节点有公式，显示公式
                        if (selectedNode.data && selectedNode.data.latex) {
                            console.log('节点有LaTeX公式，显示公式');
                            showNodeFormula(selectedNode);
                        }
                    } else {
                        // 单击且节点有备注，显示备注
                        if (selectedNode.data && selectedNode.data.note) {
                            console.log('节点有备注，显示备注');
                            showNodeNote(selectedNode);
                        }
                    }
                    selectedNode._lastClickTime = now;
                    
                    // 只有当AI助手开启时才自动显示消息
                    if (aiAssistantEnabled) {
                        if (selectedNode.topic) {
                            addMessage('ai', `您选中了节点："${selectedNode.topic}"`);
                            
                            // 尝试获取子节点信息，先检查函数是否存在
                            if (typeof getChildrenInfo === 'function') {
                                const childInfo = getChildrenInfo(selectedNode);
                                if (childInfo) {
                                    addMessage('ai', `此节点包含的内容:\n${childInfo}`);
                                }
                            }
                        } else {
                            addMessage('ai', `您选中了ID为${selectedNode.id}的节点`);
                        }
                    }
                } catch (error) {
                    console.error('节点选择处理异常:', error);
                }
                console.groupEnd();
            }
        });
        
        // 加载完成后的回调
        jm.add_event_listener(function(type) {
            if (type === jsMind.event_type.show) {
                console.log('思维导图加载完成');
                
                // 渲染所有的备注标记
                if (typeof window.renderAllNoteMarkers === 'function') {
                    window.renderAllNoteMarkers();
                } else {
                    console.warn('渲染备注标记失败: renderAllNoteMarkers函数未定义');
                }
                
                // 渲染所有已保存的关联线
                if (typeof window.updateRelationLines === 'function') {
                    window.updateRelationLines();
                } else {
                    console.warn('更新关联线失败: updateRelationLines函数未定义');
                }
            }
        });
        
    } catch (error) {
        console.error('jsMind初始化失败:', error);
        alert('思维导图初始化失败: ' + error.message);
    }
}

// 初始化侧边栏
function setupSidebars() {
    console.log('设置侧边栏...');
    
    try {
        // 确保setupLatexEditorEvents函数存在再调用
        if (typeof window.setupLatexEditorEvents === 'function') {
            window.setupLatexEditorEvents();
        } else {
            console.warn('setupLatexEditorEvents函数未定义，可能是脚本加载顺序问题');
            // 尝试延迟调用
            setTimeout(function() {
                if (typeof window.setupLatexEditorEvents === 'function') {
                    window.setupLatexEditorEvents();
                } else {
                    console.error('无法找到setupLatexEditorEvents函数');
                }
            }, 500);
        }
        
        // 设置备注和摘要侧边栏的关闭按钮
        const closeBtns = document.querySelectorAll('.sidebar-editor .sidebar-close');
        closeBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                const sidebar = this.closest('.sidebar-editor');
                if (sidebar) {
                    sidebar.classList.remove('show');
                }
            });
        });
        
        // 设置备注编辑器的应用按钮
        const noteApplyBtn = document.getElementById('note_apply');
        if (noteApplyBtn) {
            noteApplyBtn.addEventListener('click', function() {
                console.log('应用节点备注');
                
                if (!selectedNode) {
                    alert('未选择节点，无法应用备注');
                    return;
                }
                
                const noteInput = document.getElementById('node_note');
                if (!noteInput) {
                    alert('找不到备注输入框');
                    return;
                }
                
                const noteText = noteInput.value.trim();
                
                // 使用addNodeNote函数保存备注
                if (addNodeNote(selectedNode.id, noteText)) {
                    console.log('备注已成功添加到节点');
                } else {
                    console.error('添加备注失败');
                    alert('备注保存失败，请重试');
                }
                
                // 隐藏编辑器
                const editor = document.getElementById('note_editor');
                if (editor) {
                    editor.classList.remove('show');
                }
            });
        } else {
            console.warn('找不到备注应用按钮');
        }
        
        // 设置备注编辑器的取消按钮
        const noteCancelBtn = document.getElementById('note_cancel');
        if (noteCancelBtn) {
            noteCancelBtn.addEventListener('click', function() {
                const editor = document.getElementById('note_editor');
                if (editor) {
                    editor.classList.remove('show');
                }
            });
        }
        
        // 初始化LaTeX编辑器
        if (typeof window.initLatexEditor === 'function') {
            window.initLatexEditor();
        }
        
        console.log('侧边栏设置完成');
    } catch (error) {
        console.error('设置侧边栏时出错:', error);
    }
}

// 设置DOM观察器
function setupDOMObserver() {
    console.log('设置DOM观察器...');
    
    // 创建DOM变化观察器
    const observer = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
            if (mutation.type === 'childList' || mutation.type === 'attributes') {
                // 如果有选中的节点变化
                const selectedDOMNode = document.querySelector('jmnode.selected');
                if (selectedDOMNode) {
                    const domId = selectedDOMNode.getAttribute('nodeid');
                    const domTopic = selectedDOMNode.querySelector('.topic')?.textContent?.trim();
                    
                    // 确保节点在jsMind中存在
                    if (domId && jm && jm.get_node && jm.get_node(domId)) {
                        // 如果selectedNode不存在，或者selectedNode就是一个字符串
                        if (!selectedNode || typeof selectedNode === 'string') {
                            console.log('DOM中有选中节点，但selectedNode为空或是字符串，创建新的selectedNode对象');
                            const node = jm.get_node(domId);
                            if (node) {
                                // 使用jsMind中的完整节点对象
                                selectedNode = node;
                            } else {
                                // 创建基本节点对象
                                selectedNode = {
                                    id: domId,
                                    topic: domTopic || '未命名节点'
                                };
                            }
                        }
                        // 如果DOM中的选中节点与selectedNode不匹配，则更新selectedNode
                        else if (selectedNode.id !== domId || selectedNode.topic !== domTopic) {
                            console.log('DOM选中节点变化检测');
                            
                            // 更新selectedNode
                            if (domId && domTopic) {
                                selectedNode.id = domId;
                                selectedNode.topic = domTopic;
                            }
                        }
                    } else if (domId) {
                        console.warn('DOM中的节点ID在jsMind中不存在:', domId);
                    }
                } else {
                    // 如果DOM中没有选中节点，但selectedNode不为空，检查节点是否还存在
                    if (selectedNode) {
                        // 获取节点ID，考虑selectedNode可能是字符串的情况
                        const nodeId = typeof selectedNode === 'string' ? selectedNode : selectedNode.id;
                        
                        if (nodeId && jm && jm.get_node) {
                            const nodeExists = jm.get_node(nodeId);
                            if (!nodeExists) {
                                console.warn('当前selectedNode在jsMind中不存在，重置selectedNode');
                                selectedNode = null;
                            }
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
    
    // 页面关闭时断开观察器
    window.addEventListener('beforeunload', function() {
        observer.disconnect();
    });
    
    return observer;
}

// 设置节点监控
function setupNodeMonitor() {
    console.log('设置节点监控...');
    
    let consecutiveErrors = 0; // 连续错误计数
    const maxConsecutiveErrors = 3; // 最大连续错误次数
    
    let lastNodeState = {};
    const intervalId = setInterval(() => {
        try {
            if (!selectedNode) {
                return; // 没有选中节点，不执行监控
            }
            
            // 检查节点ID是否有效
            if (!selectedNode.id || typeof selectedNode.id !== 'string') {
                console.warn('监控: 选中节点ID无效:', selectedNode.id);
                return;
            }
            
            // 如果ID是临时生成的（以"未知ID"开头），跳过监控
            if (String(selectedNode.id).startsWith('未知ID_')) {
                console.warn('监控: 跳过临时ID节点:', selectedNode.id);
                return;
            }
            
            // 重新获取最新的节点数据
            const freshNode = jm.get_node(selectedNode.id);
            if (!freshNode) {
                console.warn('监控: 无法通过ID获取最新节点数据:', selectedNode.id);
                consecutiveErrors++;
                
                // 如果连续多次找不到节点，重置selectedNode
                if (consecutiveErrors >= maxConsecutiveErrors) {
                    console.error('监控: 连续多次找不到节点，重置selectedNode');
                    selectedNode = null;
                    consecutiveErrors = 0;
                }
                return;
            }
            
            // 找到节点，重置错误计数
            consecutiveErrors = 0;
            
            // 如果topic发生变化，更新selectedNode
            if (freshNode.topic !== undefined && freshNode.topic !== selectedNode.topic) {
                console.log('更新selectedNode.topic:', selectedNode.topic, '->', freshNode.topic);
                selectedNode.topic = freshNode.topic;
            }
            
            // 确保数据属性同步
            if (freshNode.data && (!selectedNode.data || JSON.stringify(freshNode.data) !== JSON.stringify(selectedNode.data))) {
                console.log('更新selectedNode.data:', selectedNode.data, '->', freshNode.data);
                selectedNode.data = freshNode.data;
            }
        } catch (error) {
            console.error('节点监控异常:', error);
            consecutiveErrors++;
            
            // 如果连续出现错误，重置selectedNode
            if (consecutiveErrors >= maxConsecutiveErrors) {
                console.error('监控: 连续多次出错，重置selectedNode');
                selectedNode = null;
                consecutiveErrors = 0;
            }
        }
    }, 2000); // 每2秒检查一次
    
    // 返回清理函数
    return function stopMonitor() {
        clearInterval(intervalId);
    };
}

// 显示节点备注的函数
function showNodeNote(node) {
    console.log('显示节点备注 - 开始处理:', node.id, node.topic);
    console.log('备注内容长度:', node.data?.note?.length || 0);
    
    if (!node || !node.data || !node.data.note) {
        console.warn('节点没有备注内容');
        return;
    }
    
    // 首先移除任何现有的备注悬浮窗
    const existingPopups = document.querySelectorAll('.node-note-popup');
    if (existingPopups.length > 0) {
        console.log(`移除${existingPopups.length}个现有备注弹窗`);
        existingPopups.forEach(popup => popup.remove());
    }
    
    // 获取节点DOM元素
    const nodeElement = document.querySelector(`jmnode[nodeid="${node.id}"]`);
    if (!nodeElement) {
        console.error('找不到节点DOM元素:', node.id);
        return;
    }
    
    console.log('创建备注弹窗');
    
    // 创建备注悬浮窗
    const popup = document.createElement('div');
    popup.className = 'node-note-popup';
    
    // 添加标题
    const title = document.createElement('div');
    title.style.fontWeight = 'bold';
    title.style.marginBottom = '8px';
    title.style.borderBottom = '1px solid #eee';
    title.style.paddingBottom = '5px';
    title.textContent = '节点备注：';
    popup.appendChild(title);
    
    // 添加备注内容
    const content = document.createElement('div');
    content.textContent = node.data.note;
    content.style.maxHeight = '250px';
    content.style.overflow = 'auto';
    popup.appendChild(content);
    
    // 添加关闭按钮
    const closeBtn = document.createElement('span');
    closeBtn.textContent = '×';
    closeBtn.className = 'close-btn';
    Object.assign(closeBtn.style, {
        position: 'absolute',
        top: '5px',
        right: '8px',
        cursor: 'pointer',
        fontSize: '18px',
        fontWeight: 'bold',
        color: '#888'
    });
    closeBtn.addEventListener('click', (e) => {
        console.log('点击关闭按钮');
        e.stopPropagation(); // 防止点击事件冒泡
        popup.remove();
    });
    popup.appendChild(closeBtn);
    
    // 将弹窗添加到body
    document.body.appendChild(popup);
    console.log('备注弹窗已添加到DOM');
    
    // 定位弹窗到节点下方
    const nodeRect = nodeElement.getBoundingClientRect();
    popup.style.left = `${nodeRect.left}px`;
    popup.style.top = `${nodeRect.bottom + 10}px`;
    
    console.log(`弹窗初始位置: left=${nodeRect.left}px, top=${nodeRect.bottom + 10}px`);
    
    // 检查弹窗是否在视口范围内，如果不在则调整位置
    setTimeout(() => {
        const popupRect = popup.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        console.log(`弹窗尺寸: width=${popupRect.width}px, height=${popupRect.height}px`);
        console.log(`视口尺寸: width=${viewportWidth}px, height=${viewportHeight}px`);
        
        let positionChanged = false;
        
        // 水平调整
        if (popupRect.right > viewportWidth) {
            const newLeft = Math.max(0, viewportWidth - popupRect.width - 10);
            console.log(`水平调整: ${popup.style.left} -> ${newLeft}px`);
            popup.style.left = `${newLeft}px`;
            positionChanged = true;
        }
        
        // 垂直调整
        if (popupRect.bottom > viewportHeight) {
            // 如果下方空间不足，显示在节点上方
            if (nodeRect.top > popupRect.height + 10) {
                const newTop = nodeRect.top - popupRect.height - 10;
                console.log(`垂直调整(上方): ${popup.style.top} -> ${newTop}px`);
                popup.style.top = `${newTop}px`;
                
                // 调整箭头位置
                const arrow = popup.querySelector('::before');
                if (arrow) {
                    arrow.style.top = 'auto';
                    arrow.style.bottom = '-6px';
                    arrow.style.borderBottom = 'none';
                    arrow.style.borderTop = '1px solid #ddd';
                    arrow.style.borderRight = '1px solid #ddd';
                }
            } else {
                // 如果上方也不足，调整最大高度
                const availableHeight = Math.max(200, viewportHeight - nodeRect.bottom - 20);
                console.log(`垂直调整(限高): maxHeight=${availableHeight}px`);
                popup.style.maxHeight = `${availableHeight}px`;
                content.style.maxHeight = `${availableHeight - 60}px`;  // 减去标题和内边距
            }
            positionChanged = true;
        }
        
        if (positionChanged) {
            console.log('已调整弹窗位置以适应视口');
        } else {
            console.log('弹窗位置无需调整');
        }
    }, 0);
    
    // 添加点击事件监听，点击其他地方时关闭弹窗
    const closePopupOnClick = (e) => {
        if (!popup.contains(e.target) && !nodeElement.contains(e.target)) {
            console.log('点击外部区域，关闭弹窗');
            popup.remove();
            document.removeEventListener('click', closePopupOnClick);
        }
    };
    
    // 延迟添加事件监听，避免立即触发
    setTimeout(() => {
        document.addEventListener('click', closePopupOnClick);
        console.log('已添加文档点击监听器');
    }, 100);
    
    console.log('备注弹窗创建完成');
    return popup;
}

// 获取节点的子节点信息
function getChildrenInfo(node) {
    if (!node || !node.children || node.children.length === 0) {
        return null;
    }
    
    let childInfo = '';
    node.children.forEach((child, index) => {
        childInfo += `${index + 1}. ${child.topic}\n`;
    });
    
    return childInfo;
}

// 添加节点备注
function addNodeNote(nodeId, noteText) {
    console.log('为节点添加备注:', nodeId);
    
    if (!nodeId || !noteText) {
        console.warn('节点ID或备注内容为空，无法添加备注');
        return false;
    }
    
    try {
        // 获取节点对象
        const node = jm.get_node(nodeId);
        if (!node) {
            console.error('找不到节点:', nodeId);
            return false;
        }
        
        // 确保节点有data对象
        if (!node.data) {
            node.data = {};
        }
        
        // 保存备注到节点
        node.data.note = noteText;
        
        // 更新节点，触发重绘
        jm.update_node(nodeId, node.topic, node.data);
        
        // 添加备注标记
        if (typeof window.addNoteMarker === 'function') {
            window.addNoteMarker(node);
            console.log('已添加备注标记');
        } else {
            console.warn('addNoteMarker函数不可用，无法添加备注标记');
        }
        
        console.log('备注添加成功');
        return true;
    } catch (e) {
        console.error('添加备注失败:', e);
        return false;
    }
}

// 导出功能到全局作用域
window.addNodeNote = addNodeNote;
window.showNodeNote = showNodeNote;

// 在index.html中修改现有的错误处理代码
window.addEventListener('error', function(e) {
    // 增强扩展错误过滤
    if (e && e.target && e.target.src && 
        (e.target.src.indexOf('chrome-extension://') !== -1 || 
         e.target.src.indexOf('moz-extension://') !== -1)) {
        console.debug('已屏蔽浏览器扩展错误:', e.target.src);
        e.stopPropagation();
        e.preventDefault();
        return true;
    }
}, true);

// 添加资源加载错误监听
window.addEventListener('unhandledrejection', function(event) {
    if (event.reason && event.reason.message && 
        event.reason.message.indexOf('chrome-extension://') !== -1) {
        event.preventDefault();
        return true;
    }
}, true);

// 设置下拉菜单的智能定位
function setupDropdownMenus() {
    console.log('设置下拉菜单的智能定位');
    
    // 处理所有下拉菜单按钮
    const dropdownTriggers = {
        'save_map': 'save_dropdown',
        'load_map': 'load_dropdown'
    };
    
    // 为每个下拉菜单添加点击处理
    Object.keys(dropdownTriggers).forEach(triggerId => {
        const dropdownId = dropdownTriggers[triggerId];
        const triggerBtn = document.getElementById(triggerId);
        const dropdown = document.getElementById(dropdownId);
        
        if (!triggerBtn || !dropdown) {
            console.warn(`找不到下拉菜单元素: ${triggerId} 或 ${dropdownId}`);
            return;
        }
        
        // 点击按钮时显示/隐藏下拉菜单
        triggerBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            // 切换其他打开的下拉菜单
            Object.values(dropdownTriggers).forEach(id => {
                if (id !== dropdownId) {
                    const otherDropdown = document.getElementById(id);
                    if (otherDropdown) otherDropdown.style.display = 'none';
                }
            });
            
            // 切换当前下拉菜单的显示状态
            const isVisible = dropdown.style.display === 'block';
            dropdown.style.display = isVisible ? 'none' : 'block';
            
            // 如果显示，则智能定位
            if (!isVisible) {
                positionDropdown(triggerBtn, dropdown);
            }
        });
    });
    
    // 点击页面其他位置关闭下拉菜单
    document.addEventListener('click', function(e) {
        Object.values(dropdownTriggers).forEach(id => {
            const dropdown = document.getElementById(id);
            // 增加检查：确保 dropdown, e.target, e.target.closest 都有效
            if (dropdown && e.target && typeof e.target.closest === 'function' && !e.target.closest(`.btn-group`)) {
                dropdown.style.display = 'none';
            }
        });
    });
    
    console.log('下拉菜单设置完成');
}

// 智能定位下拉菜单
function positionDropdown(trigger, dropdown) {
    // 获取按钮和视窗位置信息
    const buttonRect = trigger.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    
    // 重置下拉菜单位置样式
    dropdown.style.left = '';
    dropdown.style.right = '';
    
    // 先显示菜单以获取其尺寸
    dropdown.style.visibility = 'hidden';
    dropdown.style.display = 'block';
    const dropdownRect = dropdown.getBoundingClientRect();
    
    // 判断下拉菜单是否会超出右边界
    if (buttonRect.left + dropdownRect.width > viewportWidth) {
        // 如果会超出右边界，从右侧对齐
        dropdown.style.left = 'auto';
        dropdown.style.right = '0';
    } else {
        // 否则从左侧对齐
        dropdown.style.left = '0';
        dropdown.style.right = 'auto';
    }
    
    // 恢复可见性
    dropdown.style.visibility = 'visible';
    
    console.log(`下拉菜单 ${dropdown.id} 已定位`);
}

// 监听语言变化事件
document.addEventListener('languageChanged', (event) => {
    console.log('语言已更改为:', event.detail.language);
    
    // 如果jsMind已经初始化，更新标题节点文本
    if (jm) {
        const rootNode = jm.get_root();
        if (rootNode) {
            rootNode.topic = window.i18n.t('root_node');
            jm.update_node(rootNode.id, rootNode.topic); // 建议使用ID和topic更新
        }
        
        // 更新状态信息显示
        if (typeof updateStatusInfo === 'function') { // 确保函数存在
            updateStatusInfo();
        }
    }
    
    // 如果toolbar已经初始化，重新初始化以更新按钮文本
    if (typeof initToolbar === 'function') {
        initToolbar();
        
        // 关键修复：给系统一点时间完成DOM更新，然后重新设置下拉菜单
        setTimeout(() => {
            if (typeof setupDropdownMenus === 'function') {
                console.log('语言切换后重新设置下拉菜单');
                setupDropdownMenus();
            }
        }, 100);
    }
});
