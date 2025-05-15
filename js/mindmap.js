// 思维导图功能和工具栏相关

// 全局状态变量
let nodeSummaries = {}; // 保存节点摘要
let relationStartNode = null; // 关联线起始节点
let relationLines = []; // 保存关联线信息

// 注意：jm和selectedNode变量已在core.js中定义，此处不再重复定义

// 检查FontAwesome是否可用
function isFontAwesomeAvailable() {
    // 创建一个测试元素
    const testIcon = document.createElement('i');
    testIcon.className = 'fas fa-check';
    testIcon.style.display = 'none';
    document.body.appendChild(testIcon);
    
    // 获取样式
    const style = window.getComputedStyle(testIcon);
    const fontFamily = style.getPropertyValue('font-family');
    
    // 移除测试元素
    document.body.removeChild(testIcon);
    
    // 检查字体族是否包含FontAwesome
    return fontFamily.includes('Font Awesome') || fontFamily.includes('FontAwesome');
}

// 为了确保图标在所有情况下都正确加载，在全局范围存储FontAwesome状态
window.faAvailable = false;

// 通过DOM观察者监控FontAwesome的加载
function monitorFontAwesomeLoading() {
    // 检查当前状态
    window.faAvailable = isFontAwesomeAvailable();
    
    // 如果已加载，立即通知
    if (window.faAvailable) {
        console.log('FontAwesome已加载完成，可以使用图标');
        document.dispatchEvent(new CustomEvent('fontAwesomeLoaded'));
        return;
    }
    
    console.log('FontAwesome尚未加载，等待加载...');
    
    // 设置样式表加载观察者
    const observer = new MutationObserver((mutations) => {
        if (isFontAwesomeAvailable()) {
            window.faAvailable = true;
            console.log('FontAwesome成功加载，现在可以使用图标');
            document.dispatchEvent(new CustomEvent('fontAwesomeLoaded'));
            observer.disconnect();
        }
    });
    
    // 观察head元素中样式表的变化
    observer.observe(document.head, {
        childList: true,
        subtree: true
    });
    
    // 设置超时，确保不会永远等待
    setTimeout(() => {
        window.faAvailable = isFontAwesomeAvailable();
        if (!window.faAvailable) {
            console.warn('FontAwesome加载超时，图标可能不可用');
        }
        observer.disconnect();
    }, 5000);
}

// 在脚本加载时立即开始监控FontAwesome
monitorFontAwesomeLoading();

// 在fontAwesomeLoaded事件触发时重新初始化工具栏
document.addEventListener('fontAwesomeLoaded', () => {
    console.log('收到FontAwesome加载事件，重新初始化工具栏');
    if (typeof initToolbar === 'function' && document.getElementById('toolbar')) {
        initToolbar();
    }
});

// 在语言变化事件和DOMContentLoaded事件上只保留一个监听器，避免重复
document.addEventListener('languageChanged', () => {
    console.log('检测到语言变化，重新初始化工具栏');
    if (typeof initToolbar === 'function') {
        initToolbar();
    }
});

// 初始化工具栏
function initToolbar() {
    console.log('初始化工具栏');
    const toolbar = document.getElementById('toolbar');
    
    // 检查toolbar元素是否存在
    if (!toolbar) {
        console.error('找不到toolbar元素，无法初始化工具栏');
        return;
    }
    
    // 清空工具栏，防止重复添加
    toolbar.innerHTML = '';
    
    // 翻译函数 - 如果i18n可用则使用，否则返回原文
    const translate = (key) => {
        return window.i18n && typeof window.i18n.t === 'function' ? 
            window.i18n.t(key) : key;
    };
    
    // 创建上层工具栏（文件操作）
    const topRow = document.createElement('div');
    topRow.className = 'toolbar-row';
    toolbar.appendChild(topRow);
    
    // 创建下层工具栏（节点操作）
    const bottomRow = document.createElement('div');
    bottomRow.className = 'toolbar-row';
    toolbar.appendChild(bottomRow);
    
    // 定义按钮和分隔符创建函数
    const createButton = (id, textKey, titleKey, handler) => {
        const btn = document.createElement('button');
        btn.className = 'btn';
        btn.id = id;
        
        // 使用翻译函数获取文本
        const text = translate(textKey);
        const title = translate(titleKey) || text;
        
        // 添加图标
        const iconMap = {
            'new_mindmap': 'fa-file', // 新建思维导图的图标
            'add_node': 'fa-plus-circle',
            'edit_node': 'fa-edit',
            'delete_node': 'fa-trash-alt',
            'expand_all': 'fa-expand-alt',
            'collapse_all': 'fa-compress-alt',
            'latex_button': 'fa-square-root-alt',
            'note_button': 'fa-sticky-note',
            'relation_button': 'fa-link',
            'summary_button': 'fa-file-alt',
            'save_map': 'fa-save',
            'load_map': 'fa-folder-open',
            'capture': 'fa-camera', 
        };
        
        // 创建图标和文本容器
        const buttonContent = document.createElement('div');
        buttonContent.className = 'btn-content';
        buttonContent.style.display = 'flex';
        buttonContent.style.alignItems = 'center';
        buttonContent.style.justifyContent = 'center';
        buttonContent.style.width = '100%';
        
        if (iconMap[id]) {
            try {
                // 使用全局变量判断FontAwesome是否可用
                if (window.faAvailable) {
                    const icon = document.createElement('i');
                    icon.className = `fas ${iconMap[id]}`;
                    icon.style.marginRight = '5px'; // 确保图标和文本有间距
                    buttonContent.appendChild(icon);
                }
                
                // 添加文本作为单独的元素
                const textSpan = document.createElement('span');
                textSpan.textContent = text;
                textSpan.className = 'btn-text';
                buttonContent.appendChild(textSpan);
                
                // 将整个内容添加到按钮
                btn.appendChild(buttonContent);
            } catch (e) {
                console.error(`添加图标时出错: ${e.message}`, e);
                btn.textContent = text;
            }
        } else {
            btn.textContent = text;
        }
        
        btn.title = title;
        
        // 保存原始key以便语言切换时更新
        btn.dataset.i18nText = textKey;
        btn.dataset.i18nTitle = titleKey;
        
        if (handler) {
            btn.addEventListener('click', handler);
        }
        return btn;
    };
    
    const createSeparator = () => {
        const separator = document.createElement('div');
        separator.style.borderLeft = '1px solid #ddd';
        separator.style.height = '24px';
        separator.style.margin = '0 10px';
        return separator;
    };
    
    // ===== 上层工具栏（文件操作） =====
    
    // 创建第一组按钮（文件操作）
    const fileGroup = document.createElement('div');
    fileGroup.className = 'toolbar-group';
    topRow.appendChild(fileGroup);

    // {{ 新增 "新建思维导图" 按钮 }}
    fileGroup.appendChild(createButton('new_mindmap', 'new_mindmap', 'new_mindmap', createNewMindmap));
        // {{ 结束新增区域 }}
    
    const saveGroup = document.createElement('div');
    saveGroup.className = 'btn-group';
    
    // 主保存按钮
    const saveBtn = createButton('save_map', 'save_mindmap', 'save_mindmap');
    
    // 下拉菜单
    const saveDropdown = document.createElement('div');
    saveDropdown.id = 'save_dropdown';
    saveDropdown.style.display = 'none';
    
    // 添加JSON保存选项
    const saveJsonOption = document.createElement('a');
    saveJsonOption.href = '#';
    saveJsonOption.textContent = translate('save_as_json');
    saveJsonOption.dataset.i18nText = 'save_as_json';
    saveJsonOption.onclick = function(e) {
        e.preventDefault();
        window.saveAsJson();
        saveDropdown.style.display = 'none';
    };
    
    // 添加MD保存选项
    const saveMdOption = document.createElement('a');
    saveMdOption.href = '#';
    saveMdOption.textContent = translate('export_as_markdown');
    saveMdOption.dataset.i18nText = 'export_as_markdown';
    saveMdOption.onclick = function(e) {
        e.preventDefault();
        window.exportToMarkdown();
        saveDropdown.style.display = 'none';
    };
    
    // 组装下拉菜单
    saveDropdown.appendChild(saveJsonOption);
    saveDropdown.appendChild(saveMdOption);
    
    // 组装保存按钮组
    saveGroup.appendChild(saveBtn);
    saveGroup.appendChild(saveDropdown);
    fileGroup.appendChild(saveGroup);
    
    // 加载按钮组
    const loadGroup = document.createElement('div');
    loadGroup.className = 'btn-group';
    
    // 加载按钮
    const loadBtn = createButton('load_map', 'load_mindmap', 'load_mindmap');
    
    // 下拉菜单
    const loadDropdown = document.createElement('div');
    loadDropdown.id = 'load_dropdown';
    loadDropdown.style.display = 'none';
    
    // 添加JSON加载选项
    const loadJsonOption = document.createElement('a');
    loadJsonOption.href = '#';
    loadJsonOption.textContent = translate('load_json_file');
    loadJsonOption.dataset.i18nText = 'load_json_file';
    loadJsonOption.onclick = function(e) {
        e.preventDefault();
        window.loadMindMap();
        loadDropdown.style.display = 'none';
    };
    
    // 添加Markdown导入选项
    const loadMdOption = document.createElement('a');
    loadMdOption.href = '#';
    loadMdOption.textContent = translate('import_markdown');
    loadMdOption.dataset.i18nText = 'import_markdown';
    loadMdOption.onclick = function(e) {
        e.preventDefault();
        window.importFromMarkdown();
        loadDropdown.style.display = 'none';
    };
    
    // 组装下拉菜单
    loadDropdown.appendChild(loadJsonOption);
    loadDropdown.appendChild(loadMdOption);
    
    // 组装加载按钮组
    loadGroup.appendChild(loadBtn);
    loadGroup.appendChild(loadDropdown);
    fileGroup.appendChild(loadGroup);
    
    // 添加导出为图片按钮
    fileGroup.appendChild(createButton('capture', 'save_as_image', 'save_as_image', window.exportAsImage));
    
    // 添加主题选择器
    const themeGroup = document.createElement('div');
    themeGroup.className = 'toolbar-group';
    topRow.appendChild(themeGroup);
    
    const themeSelect = document.createElement('select');
    themeSelect.id = 'theme_select';
    themeSelect.title = translate('select_theme');
    
    const themes = [
        {value: 'primary', textKey: 'blue_theme'},
        {value: 'warning', textKey: 'yellow_theme'},
        {value: 'danger', textKey: 'red_theme'},
        {value: 'success', textKey: 'green_theme'}
    ];
    
    themes.forEach(theme => {
        const option = document.createElement('option');
        option.value = theme.value;
        option.textContent = translate(theme.textKey);
        option.dataset.i18nText = theme.textKey; // 确保使用正确的属性名
        themeSelect.appendChild(option);
    });
    
    themeSelect.addEventListener('change', function() {
        jm.set_theme(this.value);
    });
    
    themeGroup.appendChild(themeSelect);
    
    // ===== 下层工具栏（节点操作） =====
    
    // 创建节点操作按钮组
    const nodeGroup = document.createElement('div');
    nodeGroup.className = 'toolbar-group';
    bottomRow.appendChild(nodeGroup);
    
    // 添加节点操作基本按钮
    nodeGroup.appendChild(createButton('add_node', 'add_node', 'add_node', addNode));
    nodeGroup.appendChild(createButton('edit_node', 'edit_node', 'edit_node', editNode));
    nodeGroup.appendChild(createButton('delete_node', 'delete_node', 'delete_node', deleteNode));
    nodeGroup.appendChild(createButton('expand_all', 'expand_all', 'expand_all', () => jm.expand_all()));
    nodeGroup.appendChild(createButton('collapse_all', 'collapse_all', 'collapse_all', () => jm.collapse_all()));
    
    // 添加分隔符
    bottomRow.appendChild(createSeparator());
    
    // 创建高级功能按钮组
    const advancedGroup = document.createElement('div');
    advancedGroup.className = 'toolbar-group';
    bottomRow.appendChild(advancedGroup);
    
    // 添加高级功能按钮
    advancedGroup.appendChild(createButton('latex_button', 'formula', 'formula', openLatexEditor));
    advancedGroup.appendChild(createButton('note_button', 'note', 'note', openNoteEditor));
    // advancedGroup.appendChild(createButton('relation_button', 'relation_line', 'relation_line', startRelationLine));
    // advancedGroup.appendChild(createButton('summary_button', 'summary', 'summary', openSummaryEditor));
    
    // 点击文档关闭下拉菜单
    document.addEventListener('click', function(event) {
        if (!saveGroup.contains(event.target)) {
            saveDropdown.style.display = 'none';
        }
        if (!loadGroup.contains(event.target)) {
            loadDropdown.style.display = 'none';
        }
    });
    
    console.log('工具栏初始化完成');
}

// 注册语言变化监听器以重新初始化工具栏
document.addEventListener('DOMContentLoaded', () => {
    document.addEventListener('languageChanged', () => {
        console.log('检测到语言变化，重新初始化工具栏');
        if (typeof initToolbar === 'function') {
            initToolbar();
        }
    });
});

// 初始化缩放控制器
function initZoomController() {
    console.log('初始化缩放控制器');
    
    const zoomOut = document.getElementById('zoom_out');
    const zoomIn = document.getElementById('zoom_in');
    const resetView = document.getElementById('reset_view');
    const centerView = document.getElementById('center_view');
    const zoomText = document.getElementById('zoom_text');
    
    if (!zoomOut || !zoomIn || !resetView || !centerView || !zoomText) {
        console.error('找不到缩放控制器元素');
        return;
    }
    
    zoomOut.addEventListener('click', function() {
        if (zoomLevel > 50) {
            zoomLevel -= 10;
            updateZoom();
        }
    });
    
    zoomIn.addEventListener('click', function() {
        if (zoomLevel < 200) {
            zoomLevel += 10;
            updateZoom();
        }
    });
    
    resetView.addEventListener('click', function() {
        zoomLevel = 100;
        updateZoom();
    });
    
    centerView.addEventListener('click', function() {
        if (jm && jm.view && jm.get_root) {
            jm.view.center_node(jm.get_root());
        }
    });
    
    // 初始更新缩放文本
    zoomText.innerText = zoomLevel + '%';
    
    console.log('缩放控制器初始化完成');
}

// 添加节点备注标记的优化函数
function addNoteMarker(node) {
    try {
        // 只有当节点有备注时才添加标记
        if (!node || !node.data || !node.data.note) {
            return;
        }
        
        // 获取节点DOM元素
        let nodeElement = document.querySelector(`jmnode[nodeid="${node.id}"]`);
        
        // 如果找不到，尝试使用备用查找方法
        if (!nodeElement) {
            nodeElement = document.querySelector(`[nodeid="${node.id}"]`);
            
            // 如果还是找不到，尝试通过jm查找
            if (!nodeElement && jm && jm.view) {
                const nodeElem = jm.view.get_node_element(node.id);
                if (nodeElem) {
                    nodeElement = nodeElem;
                }
            }
        }
        
        if (!nodeElement) {
            console.warn('找不到节点的DOM元素:', node.id);
            return;
        }
        
        // 为整个节点添加title属性，以便在鼠标悬停时显示备注内容预览
        const notePreview = node.data.note.length > 50 ? 
            node.data.note.substring(0, 50) + '...' : node.data.note;
        nodeElement.setAttribute('title', `备注: ${notePreview}`);
        
        // 检查是否已有标记
        if (nodeElement.querySelector('.note-indicator')) {
            return;
        }
        
        // 获取节点内容元素
        let topicElement = nodeElement.querySelector('.topic');
        
        // 如果找不到.topic，尝试查找其他可能的内容元素
        if (!topicElement) {
            topicElement = nodeElement.firstElementChild || nodeElement;
        }
        
        if (!topicElement) {
            console.warn('找不到节点内容元素');
            return;
        }
        
        // 创建备注指示器按钮
        const noteIndicator = document.createElement('span');
        noteIndicator.className = 'note-indicator';
        noteIndicator.setAttribute('title', '查看备注');
        
        // 设置样式
        Object.assign(noteIndicator.style, {
            marginLeft: '4px',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            verticalAlign: 'middle',
            width: '18px',
            height: '18px',
            borderRadius: '50%',
            backgroundColor: 'rgba(0, 0, 0, 0.05)',
            transition: 'all 0.2s ease',
            position: 'relative'
        });
        
        // 添加HTML图标作为备用
        noteIndicator.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" style="fill:#333;">
                <path d="M21 6v14c0 1.1-.9 2-2 2H5c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2h1V2h2v2h8V2h2v2h1c1.1 0 2 .9 2 2zM5 8h14V6H5v2zm14 12V10H5v10h14z"></path>
            </svg>
        `;
        
        // 悬停在图标上时改变样式
        noteIndicator.addEventListener('mouseover', function() {
            this.style.backgroundColor = 'rgba(0, 0, 0, 0.1)';
            this.style.transform = 'scale(1.1)';
        });
        
        noteIndicator.addEventListener('mouseout', function() {
            this.style.backgroundColor = 'rgba(0, 0, 0, 0.05)';
            this.style.transform = 'scale(1)';
        });
        
        // 点击备注图标时显示备注
        noteIndicator.addEventListener('click', function(e) {
            e.stopPropagation(); // 防止触发节点选择事件
            
            // 确保节点已被选中
            if (selectedNode?.id !== node.id) {
                selectedNode = node;
            }
            
            // 调用显示悬浮窗口函数
            showFloatingNoteWindow(node);
        });
        
        // 将指示器添加到节点内容后
        topicElement.appendChild(noteIndicator);
    } catch (e) {
        console.error('添加备注标记失败:', e);
    }
}

// 导出函数到全局作用域
window.renderAllNoteMarkers = renderAllNoteMarkers;
window.updateRelationLines = updateRelationLines;
window.initToolbar = initToolbar;
window.initZoomController = initZoomController;
window.addNoteMarker = addNoteMarker;
window.createNewMindmap = createNewMindmap;
window.showFloatingNoteWindow = showFloatingNoteWindow;

function createNewMindmap() {
    console.log('创建新的思维导图...');
    
    // 询问用户是否确定要创建新图（会丢失当前未保存的内容）
    if (jm && confirm(window.i18n && typeof window.i18n.t === 'function' ? 
            window.i18n.t('new_mindmap_confirm') : '确定要创建新的思维导图吗？当前未保存的内容将丢失。')) {
        
        try {
            // 获取适合当前语言的根节点名称
            const rootNodeText = window.i18n && typeof window.i18n.t === 'function' ? 
                window.i18n.t('root_node') : '根节点';
            
            // 创建新的思维导图数据
            const newMindmapData = {
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
            
            // 显示新的思维导图
            jm.show(newMindmapData);
            
            // 重置全局状态
            selectedNode = null;
            nodeIdCounter = 0;  // 重置节点ID计数器
            
            // 确保根节点居中显示
            if (jm.view) {
                setTimeout(() => {
                    jm.view.center_node(jm.get_root());
                }, 100);
            }
            
            console.log('已创建新的思维导图');
            return true;
        } catch (error) {
            console.error('创建新思维导图失败:', error);
            alert(window.i18n && typeof window.i18n.t === 'function' ? 
                window.i18n.t('new_mindmap_error', '创建失败: ' + error.message) : 
                '创建失败: ' + error.message);
            return false;
        }
    } else {
        console.log('用户取消了创建新思维导图');
        return false;
    }
}

// 更新缩放级别
function updateZoom() {
    const zoomText = document.getElementById('zoom_text');
    if (zoomText) {
        zoomText.innerText = zoomLevel + '%';
    }
    
    // 使用jsMind提供的标准缩放方法
    if (jm && jm.view && typeof jm.view.set_zoom === 'function') {
        jm.view.set_zoom(zoomLevel / 100);
    }
}

// 基本节点操作
function addNode() {
    console.log('添加节点...');
    
    if (!selectedNode) {
        alert(window.i18n.t('select_node_first'));
        return;
    }
    
    try {
        // 确保selectedNode有有效的ID
        if (!selectedNode.id) {
            console.error('选中节点没有有效ID:', selectedNode);
            
            // 特殊处理：如果selectedNode本身是字符串(可能是节点ID)
            if (typeof selectedNode === 'string') {
                console.log('selectedNode是字符串ID:', selectedNode);
                const nodeObj = jm.get_node(selectedNode);
                if (nodeObj) {
                    console.log('从ID获取到节点对象:', nodeObj.id);
                    selectedNode = nodeObj;
                } else {
                    alert(window.i18n.t('node_add_error', '无法从ID获取节点对象'));
                    return;
                }
            } else {
                alert(window.i18n.t('invalid_node_id'));
                return;
            }
        }
        
        console.log('父节点信息:', {
            id: selectedNode.id,
            topic: selectedNode.topic,
            isObject: typeof selectedNode === 'object'
        });
        
        // 获取父节点对象 - 这是关键修复
        const parentNode = jm.get_node(selectedNode.id);
        if (!parentNode) {
            console.error('无法获取父节点对象:', selectedNode.id);
            
            // 尝试获取根节点作为备用
            const rootNode = jm.get_root();
            if (!rootNode) {
                alert(window.i18n.t('node_add_error', '找不到父节点且无法获取根节点'));
                return;
            }
            
            // 提示用户选择是使用根节点还是取消操作
            if (confirm(window.i18n.t('root_switch_confirm'))) {
                // 将选中节点更新为根节点
                selectedNode = rootNode;
                console.log('已切换到根节点:', rootNode.id);
            } else {
                console.log('用户取消了添加节点操作');
                return;
            }
        }
        
        // 使用最新的selectedNode重新获取父节点
        const actualParentNode = jm.get_node(selectedNode.id);
        if (!actualParentNode) {
            alert(window.i18n.t('node_add_error', '无法获取有效的父节点'));
            return;
        }
        
        // 确保父节点有children属性 (即使是空数组)
        if (!actualParentNode.children) {
            console.log('父节点没有children属性，初始化为空数组');
            actualParentNode.children = [];
        }
        
        // 生成新节点的唯一ID
        const newNodeId = generateUniqueID();
        console.log('新节点ID:', newNodeId);
        
        // 使用正确的父节点对象添加节点
        jm.add_node(actualParentNode, newNodeId, window.i18n.t('new_node'));
        console.log('节点添加成功');
    } catch (e) {
        console.error('添加节点失败:', e);
        alert(window.i18n.t('node_add_error', e.message));
    }
}

function editNode() {
    console.log('编辑节点...');
    
    if (!selectedNode) {
        alert(window.i18n.t('select_node_first'));
        return;
    }
    
    try {
        const newTopic = prompt(window.i18n.t('edit_node'), selectedNode.topic);
        if (newTopic !== null) {
            // 检查节点ID是否有效
            if (!selectedNode.id || typeof selectedNode.id !== 'string') {
                console.error('选中节点没有有效ID:', selectedNode);
                alert(window.i18n.t('invalid_node_id'));
                return;
            }
            
            jm.update_node(selectedNode.id, newTopic);
            console.log('节点编辑成功:', newTopic);
        }
    } catch (e) {
        console.error('编辑节点失败:', e);
        alert(window.i18n.t('node_edit_error', e.message));
    }
}

function deleteNode() {
    console.log('删除节点...');
    
    if (!selectedNode) {
        alert(window.i18n.t('select_node_first'));
        return;
    }
    
    try {
        // 检查节点ID是否有效
        if (!selectedNode.id || typeof selectedNode.id !== 'string') {
            console.error('选中节点没有有效ID:', selectedNode);
            alert(window.i18n.t('invalid_node_id'));
            return;
        }
        
        // 禁止删除根节点
        if (selectedNode.id === 'root') {
            alert(window.i18n.t('cant_delete_root'));
            return;
        }
        
        // 确认删除操作
        if (confirm(window.i18n.t('delete_confirm'))) {
            console.log('删除节点:', selectedNode.id);
            jm.remove_node(selectedNode.id);
            selectedNode = null;  // 清除选中状态
        }
    } catch (e) {
        console.error('删除节点失败:', e);
        alert(window.i18n.t('node_delete_error', e.message));
    }
}

// LaTeX相关函数
function openLatexEditor() {
    console.log('打开LaTeX编辑器...');
    
    if (!selectedNode) {
        alert(window.i18n.t('select_node_first'));
        return;
    }
    
    if (typeof window.showLatexEditor === 'function') {
        window.showLatexEditor(selectedNode);
    } else {
        alert(window.i18n.t('formula_editor_not_ready'));
    }
}

// 关联线相关函数
function startRelationLine() {
    if (!selectedNode) {
        alert(window.i18n.t('select_node_first'));
        return;
    }
    
    relationStartNode = selectedNode;
    alert(window.i18n.t('relation_start_select', relationStartNode.topic));
}

// 摘要相关函数
function openSummaryEditor() {
    if (!selectedNode) {
        alert(window.i18n.t('select_node_first'));
        return;
    }
    
    console.log('打开摘要编辑器');
    const editor = document.getElementById('summary_editor');
    if (!editor) {
        alert(window.i18n.t('summary_editor_not_found'));
        return;
    }
    
    const summaryInput = document.getElementById('node_summary');
    if (!summaryInput) {
        alert(window.i18n.t('summary_input_not_found'));
        return;
    }
    
    // 获取当前节点的摘要（如果有）
    const currentSummary = nodeSummaries[selectedNode.id] || '';
    summaryInput.value = currentSummary;
    
    // 显示编辑器
    editor.classList.add('show');
}

// 备注相关函数
function openNoteEditor() {
    console.log('打开备注编辑器...');
    
    if (!selectedNode) {
        alert(window.i18n.t('select_node_first'));
        return;
    }
    
    const noteEditor = document.getElementById('note_editor');
    if (!noteEditor) {
        alert(window.i18n.t('note_editor_not_found'));
        return;
    }
    
    const noteInput = document.getElementById('node_note');
    if (!noteInput) {
        alert(window.i18n.t('note_input_not_found'));
        return;
    }
    
    // 从节点获取当前注释值
    const nodeData = jm.get_node(selectedNode.id).data;
    const currentNote = nodeData && nodeData.note ? nodeData.note : '';
    
    // 设置当前值并显示编辑器
    noteInput.value = currentNote;
    noteEditor.style.display = 'block';
    noteInput.focus();
}

// 渲染所有备注标记
function renderAllNoteMarkers() {
    if (!jm || !jm.mind || !jm.mind.nodes) {
        console.warn('jsMind实例未就绪，无法渲染备注标记');
        return;
    }
    
    try {
        // 清理所有现有的备注图标和提示框
        document.querySelectorAll('.note-tooltip').forEach(tooltip => {
            tooltip.remove();
        });
        document.querySelectorAll('.note-indicator').forEach(indicator => {
            indicator.remove();
        });
        
        // 获取所有节点对象
        const nodes = jm.mind.nodes;
        let noteCount = 0;
        
        // 遍历所有节点添加备注标记
        Object.values(nodes).forEach((node) => {
            try {
                // 检查节点是否有效且有备注
                if (node && node.id && node.data && node.data.note && 
                    typeof node.data.note === 'string' && node.data.note.trim() !== '') {
                    
                    // 尝试添加备注标记
                                addNoteMarker(node);
                                noteCount++;
                }
            } catch (nodeError) {
                console.error(`处理节点 ${node?.id || '未知'} 时出错:`, nodeError);
            }
        });
        
        // 如果没有添加任何备注图标，但存在有备注的节点，进行一次额外检查
        if (noteCount === 0) {
            // 延迟执行，给DOM渲染一些时间
            setTimeout(() => {
                Object.values(nodes).forEach((node) => {
                    if (node && node.data && node.data.note && 
                        typeof node.data.note === 'string' && node.data.note.trim() !== '') {
                        
                            // 手动查找节点DOM元素
                            const nodeElement = document.querySelector(`jmnode[nodeid="${node.id}"]`);
                            if (nodeElement) {
                                try {
                                    addNoteMarker(node);
                                } catch (e) {
                                    console.error(`手动添加备注标记失败:`, e);
                                }
                            }
                        }
                    });
            }, 500);
        }
    } catch (e) {
        console.error('渲染备注标记失败:', e);
    }
}

// 更新所有关联线位置
function updateRelationLines() {
    // 此函数留空，等待具体实现
}

// 显示悬浮在画布上方的备注窗口
function showFloatingNoteWindow(node) {
    if (!node || !node.data || !node.data.note) {
        console.warn('节点没有备注内容');
        return;
    }
    
    console.log('显示悬浮备注窗口:', node.id, node.topic);
    
    // 移除任何已存在的悬浮窗
    const existingWindows = document.querySelectorAll('.floating-note-window');
    existingWindows.forEach(win => win.remove());
    
    // 创建悬浮窗容器
    const floatingWindow = document.createElement('div');
    floatingWindow.className = 'floating-note-window';
    
    // 设置样式，确保悬浮窗位于最上层
    Object.assign(floatingWindow.style, {
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: '10000', // 确保在所有元素之上
        backgroundColor: 'white',
        border: '1px solid #ccc',
        borderRadius: '8px',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
        padding: '20px',
        maxWidth: '500px',
        width: '80%',
        maxHeight: '80vh',
        overflow: 'auto',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'Arial, sans-serif'
    });
    
    // 创建标题栏
    const titleBar = document.createElement('div');
    Object.assign(titleBar.style, {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid #eaeaea',
        paddingBottom: '12px',
        marginBottom: '15px'
    });
    
    // 添加标题
    const title = document.createElement('div');
    title.textContent = node.topic || '节点备注';
    Object.assign(title.style, {
        fontWeight: 'bold',
        fontSize: '18px',
        color: '#333'
    });
    titleBar.appendChild(title);
    
    // 添加关闭按钮
    const closeBtn = document.createElement('button');
    closeBtn.textContent = '×';
    Object.assign(closeBtn.style, {
        background: 'none',
        border: 'none',
        fontSize: '24px',
        color: '#666',
        cursor: 'pointer',
        padding: '0 5px',
        lineHeight: '1'
    });
    closeBtn.addEventListener('click', () => floatingWindow.remove());
    titleBar.appendChild(closeBtn);
    
    // 添加内容区域
    const content = document.createElement('div');
    content.textContent = node.data.note;
    Object.assign(content.style, {
        fontSize: '16px',
        lineHeight: '1.6',
        color: '#444',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word'
    });
    
    // 组装窗口
    floatingWindow.appendChild(titleBar);
    floatingWindow.appendChild(content);
    
    // 添加到body
    document.body.appendChild(floatingWindow);
    
    // 允许拖动悬浮窗
    let isDragging = false;
    let offsetX, offsetY;
    
    titleBar.addEventListener('mousedown', function(e) {
        // 确保不是点击关闭按钮
        if (e.target !== closeBtn) {
            isDragging = true;
            offsetX = e.clientX - floatingWindow.getBoundingClientRect().left;
            offsetY = e.clientY - floatingWindow.getBoundingClientRect().top;
            
            // 修改光标样式
            titleBar.style.cursor = 'grabbing';
        }
    });
    
    document.addEventListener('mousemove', function(e) {
        if (isDragging) {
            // 改为直接设置具体位置，取消transform
            floatingWindow.style.transform = 'none';
            floatingWindow.style.left = `${e.clientX - offsetX}px`;
            floatingWindow.style.top = `${e.clientY - offsetY}px`;
        }
    });
    
    document.addEventListener('mouseup', function() {
        if (isDragging) {
            isDragging = false;
            titleBar.style.cursor = 'grab';
        }
    });
    
    // 设置标题栏的初始光标样式
    titleBar.style.cursor = 'grab';
    
    // 添加点击监听，点击其他节点或空白处时关闭窗口
    document.addEventListener('click', function closeOnClick(e) {
        // 如果点击的是当前窗口内的元素，不做处理
        if (floatingWindow.contains(e.target)) {
            return;
        }
        
        // 检查点击的是否是任何节点元素
        const clickedNode = e.target.closest('jmnode');
        const clickedOnCanvas = e.target.closest('#jsmind_container');
        
        // 如果点击了其他节点或画布空白处，关闭窗口
        if (clickedNode || (clickedOnCanvas && !clickedNode)) {
            console.log('点击了其他节点或空白处，关闭备注窗口');
            floatingWindow.remove();
            document.removeEventListener('click', closeOnClick);
        }
    });
    
    // 点击事件监听器需要延迟添加，避免立即触发
    setTimeout(() => {
        // 阻止第一次点击事件触发关闭
        const initialClickEvent = (e) => {
            e.stopPropagation();
            document.removeEventListener('click', initialClickEvent, true);
        };
        document.addEventListener('click', initialClickEvent, true);
    }, 0);
    
    // 按Esc键关闭窗口
    const escKeyHandler = function(e) {
        if (e.key === 'Escape') {
            floatingWindow.remove();
            document.removeEventListener('keydown', escKeyHandler);
        }
    };
    document.addEventListener('keydown', escKeyHandler);
    
    return floatingWindow;
}