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
            'load_map': 'fa-folder-open'
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
                // 检查FontAwesome是否可用
                const fontAwesomeAvailable = window.faAvailable || 
                    document.querySelector('link[href*="font-awesome"]') || 
                    isFontAwesomeAvailable();
                
                if (fontAwesomeAvailable) {
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
    
    // 添加保存按钮组（带下拉菜单）
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
        saveAsJson();
        saveDropdown.style.display = 'none';
    };
    
    // 添加MD保存选项
    const saveMdOption = document.createElement('a');
    saveMdOption.href = '#';
    saveMdOption.textContent = translate('export_as_markdown');
    saveMdOption.dataset.i18nText = 'export_as_markdown';
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
        loadMindMap();
        loadDropdown.style.display = 'none';
    };
    
    // 添加Markdown导入选项
    const loadMdOption = document.createElement('a');
    loadMdOption.href = '#';
    loadMdOption.textContent = translate('import_markdown');
    loadMdOption.dataset.i18nText = 'import_markdown';
    loadMdOption.onclick = function(e) {
        e.preventDefault();
        importFromMarkdown();
        loadDropdown.style.display = 'none';
    };
    
    // 组装下拉菜单
    loadDropdown.appendChild(loadJsonOption);
    loadDropdown.appendChild(loadMdOption);
    
    // 组装加载按钮组
    loadGroup.appendChild(loadBtn);
    loadGroup.appendChild(loadDropdown);
    fileGroup.appendChild(loadGroup);
    
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

function addNoteMarker(node) {
    try {
        console.log('开始为节点添加备注标记:', node.id, node.topic);
        
        // 只有当节点有备注时才添加标记
        if (!node || !node.data || !node.data.note) {
            console.log('节点没有备注，跳过添加标记');
            return;
        }
        
        // 获取节点DOM元素 - 改进选择器以提高兼容性
        let nodeElement = document.querySelector(`jmnode[nodeid="${node.id}"]`);
        
        // 如果找不到，尝试使用备用查找方法
        if (!nodeElement) {
            // 尝试查找包含id属性的元素
            nodeElement = document.querySelector(`[nodeid="${node.id}"]`);
            
            // 如果还是找不到，尝试通过jm查找
            if (!nodeElement && jm && jm.view) {
                console.log('使用备用方法查找节点DOM元素');
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
        
        console.log('成功找到节点DOM元素:', node.id);
        
        // 检查是否已有标记
        if (nodeElement.querySelector('.note-indicator')) {
            console.log('节点已有备注标记，跳过');
            return;
        }
        
        // 获取节点内容元素
        let topicElement = nodeElement.querySelector('.topic');
        
        // 如果找不到.topic，尝试查找其他可能的内容元素
        if (!topicElement) {
            topicElement = nodeElement.firstElementChild || nodeElement;
            console.log('使用备用元素作为topic容器');
        }
        
        if (!topicElement) {
            console.warn('找不到节点内容元素');
            return;
        }
        
        console.log('成功找到topic元素');
        
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
        
        // 鼠标悬停效果
        noteIndicator.addEventListener('mouseover', function() {
            this.style.backgroundColor = 'rgba(0, 0, 0, 0.1)';
            this.style.transform = 'scale(1.1)';
        });
        
        noteIndicator.addEventListener('mouseout', function() {
            this.style.backgroundColor = 'rgba(0, 0, 0, 0.05)';
            this.style.transform = 'scale(1)';
        });
        
        // 创建悬浮提示框
        const tooltip = document.createElement('div');
        tooltip.className = 'note-tooltip';
        
        // 添加标题行
        const titleRow = document.createElement('div');
        titleRow.style.borderBottom = '1px solid #eaeaea';
        titleRow.style.padding = '0 0 6px 0';
        titleRow.style.marginBottom = '8px';
        titleRow.style.fontWeight = 'bold';
        titleRow.style.color = '#333';
        titleRow.textContent = node.topic || '节点备注';
        tooltip.appendChild(titleRow);
        
        // 添加备注内容
        const contentDiv = document.createElement('div');
        contentDiv.textContent = node.data.note;
        tooltip.appendChild(contentDiv);
        
        tooltip.dataset.nodeId = node.id;
        
        // 设置tooltip样式
        Object.assign(tooltip.style, {
            position: 'absolute',
            zIndex: '1000',
            backgroundColor: '#fff',
            border: '1px solid #ddd',
            borderRadius: '6px',
            padding: '10px 14px',
            boxShadow: '0 3px 12px rgba(0,0,0,0.15)',
            maxWidth: '350px',
            maxHeight: '250px',
            overflow: 'auto',
            display: 'none',
            whiteSpace: 'pre-wrap',
            fontSize: '14px',
            lineHeight: '1.5',
            color: '#333',
            cursor: 'default',
            pointerEvents: 'auto',
            userSelect: 'text'
        });

        // 用于跟踪鼠标位置的变量
        let isTooltipHovered = false;
        let isIndicatorHovered = false;
        let isNodeHovered = false;
        
        // 显示提示框函数
        function showTooltip() {
            // 获取节点位置
            const rect = nodeElement.getBoundingClientRect();
            
            // 设置提示框位置 - 在节点右侧
            const topPosition = rect.top + window.scrollY;
            const leftPosition = rect.right + window.scrollX + 10; // 10px的间距
            
            // 应用位置
            tooltip.style.top = `${topPosition}px`;
            tooltip.style.left = `${leftPosition}px`;
            
            // 显示提示框
            tooltip.style.display = 'block';
            tooltip.style.opacity = '0';
            tooltip.style.transform = 'translateY(-5px)';
            
            // 稍微延迟后添加过渡效果
            setTimeout(() => {
                tooltip.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
                tooltip.style.opacity = '1';
                tooltip.style.transform = 'translateY(0)';
            }, 10);
        }
        
        // 鼠标悬停时显示提示框 - 备注图标
        noteIndicator.addEventListener('mouseover', function(e) {
            isIndicatorHovered = true;
            showTooltip();
        });
        
        // 鼠标移出图标
        noteIndicator.addEventListener('mouseout', function(e) {
            isIndicatorHovered = false;
            // 延迟隐藏，给用户时间将鼠标移动到提示框上
            setTimeout(() => {
                if (!isTooltipHovered && !isIndicatorHovered && !isNodeHovered) {
                    hideTooltip();
                }
            }, 50);
        });
        
        // 鼠标悬停时显示提示框 - 整个节点
        nodeElement.addEventListener('mouseover', function(e) {
            // 如果鼠标悬停在备注图标上，不做处理（避免重复）
            if (e.target === noteIndicator || noteIndicator.contains(e.target)) {
                return;
            }
            isNodeHovered = true;
            showTooltip();
        });
        
        // 鼠标移出节点
        nodeElement.addEventListener('mouseout', function(e) {
            // 确保鼠标真的离开了节点，而不是移到节点的子元素上
            // relatedTarget 是鼠标移到的目标元素
            if (this.contains(e.relatedTarget)) {
                return;
            }
            isNodeHovered = false;
            // 延迟隐藏，给用户时间将鼠标移动到提示框上
            setTimeout(() => {
                if (!isTooltipHovered && !isIndicatorHovered && !isNodeHovered) {
                    hideTooltip();
                }
            }, 50);
        });
        
        // 鼠标移入提示框
        tooltip.addEventListener('mouseover', function() {
            isTooltipHovered = true;
        });
        
        // 鼠标移出提示框
        tooltip.addEventListener('mouseout', function(e) {
            // 确保鼠标真的离开了提示框，而不是移到提示框的子元素上
            if (this.contains(e.relatedTarget)) {
                return;
            }
            isTooltipHovered = false;
            // 延迟隐藏，避免闪烁
            setTimeout(() => {
                if (!isTooltipHovered && !isIndicatorHovered && !isNodeHovered) {
                    hideTooltip();
                }
            }, 50);
        });
        
        // 隐藏提示框函数
        function hideTooltip() {
            tooltip.style.opacity = '0';
            tooltip.style.transform = 'translateY(-5px)';
            
            // 等待过渡效果完成后隐藏
            setTimeout(() => {
                tooltip.style.display = 'none';
            }, 200);
        }
        
        // 将提示框添加到body
        document.body.appendChild(tooltip);
        
        // 将指示器添加到节点内容后
        topicElement.appendChild(noteIndicator);
        
        // 添加小动画提示用户
        noteIndicator.style.transform = 'scale(0.8)';
        setTimeout(() => {
            noteIndicator.style.transform = 'scale(1.1)';
            setTimeout(() => {
                noteIndicator.style.transform = 'scale(1)';
            }, 200);
        }, 10);
        
        console.log('备注标记添加成功');
    } catch (e) {
        console.error('添加备注标记失败:', e);
    }
}

// 导出函数到全局作用域供其他模块使用
window.renderAllNoteMarkers = renderAllNoteMarkers;
window.updateRelationLines = updateRelationLines;
window.initToolbar = initToolbar;
window.initZoomController = initZoomController;
window.importFromMarkdown = importFromMarkdown;
window.exportToMarkdown = exportToMarkdown;
window.addNoteMarker = addNoteMarker;

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
        
        // 检查是否为根节点
        if (selectedNode.id === 'root') {
            alert(window.i18n.t('cant_delete_root'));
            return;
        }
        
        if (confirm(window.i18n.t('delete_confirm'))) {
            const nodeId = selectedNode.id;
            jm.remove_node(nodeId);
            selectedNode = null;
            console.log('节点删除成功:', nodeId);
        }
    } catch (e) {
        console.error('删除节点失败:', e);
        alert(window.i18n.t('node_delete_error', e.message));
    }
}

// LaTeX相关函数
function openLatexEditor() {
    console.log('打开公式编辑器');
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
    if (!selectedNode) {
        alert(window.i18n.t('select_node_first'));
        return;
    }
    
    const editor = document.getElementById('note_editor');
    if (!editor) {
        alert(window.i18n.t('note_editor_not_found'));
        return;
    }
    
    const noteInput = document.getElementById('node_note');
    if (!noteInput) {
        alert(window.i18n.t('note_input_not_found'));
        return;
    }
    
    // 从节点数据中获取当前备注
    const currentNote = selectedNode.data && selectedNode.data.note ? selectedNode.data.note : '';
    noteInput.value = currentNote;
    
    // 显示编辑器
    editor.classList.add('show');
}

// 保存与加载
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
        alert(window.i18n.t('save_success', 'JSON'));
    }
}

function loadMindMap() {
    try {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.onchange = function(e) {
            const file = e.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = function(event) {
                try {
                    const data = JSON.parse(event.target.result);
                    jm.show(data);
                    console.log('已加载JSON格式思维导图');
                } catch (err) {
                    alert('加载失败: ' + err.message);
                }
            };
            
            reader.readAsText(file);
        };
        
        input.click();
    } catch (e) {
        console.error('加载思维导图失败:', e);
        alert('加载失败: ' + e.message);
    }
}

function exportToMarkdown() {
    try {
        console.log('开始导出为Markdown格式');
        
        if (!jm || !jm.mind || !jm.mind.root) {
            alert('思维导图数据尚未加载');
            return;
        }
        
        // 获取思维导图数据
        const root = jm.mind.root;
        let markdown = '';
        
        // 添加标题（根节点）
        markdown += `# ${root.topic}\n\n`;
        
        // 递归生成Markdown内容
        if (root.children && root.children.length > 0) {
            markdown += generateMarkdownFromNodes(root.children, 0);
        }
        
        // 创建并下载Markdown文件
        const blob = new Blob([markdown], {type: "text/markdown"});
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = 'mindmap.md';
        document.body.appendChild(a);
        a.click();
        
        setTimeout(function() {
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        }, 0);
        
        console.log('成功导出为Markdown格式');
    } catch (e) {
        console.error('导出Markdown失败:', e);
        alert('导出失败: ' + e.message);
    }
}

// 递归生成Markdown内容的辅助函数
function generateMarkdownFromNodes(nodes, level) {
    let markdown = '';
    const indent = '  '.repeat(level); // 缩进
    
    nodes.forEach(node => {
        // 添加列表项，每一层级使用不同数量的空格缩进
        markdown += `${indent}- ${node.topic}\n`;
        
        // 添加节点备注（如果有）
        if (node.data && node.data.note) {
            let noteContent = node.data.note;
            
            // 尝试移除备注数据中可能已存在的 "*注释:" 前缀
            const prefixRegex = /^\s*\*?\s*注释:\s*/;
            noteContent = noteContent.replace(prefixRegex, '');
            
            // 正确处理多行备注的缩进
            const processedNote = noteContent.replace(/\n/g, `\n${indent}  > `);
            markdown += `${indent}  > *注释: ${processedNote}*\n`;
        }
        
        // 递归处理子节点
        if (node.children && node.children.length > 0) {
            markdown += generateMarkdownFromNodes(node.children, level + 1);
        }
    });
    
    return markdown;
}

// 添加从Markdown导入思维导图的功能
function importFromMarkdown() {
    try {
        console.log('准备从Markdown导入');
        
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.md, .markdown, text/markdown';
        
        input.onchange = function(e) {
            const file = e.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = function(event) {
                try {
                    const markdown = event.target.result;
                    const mindmapData = parseMDToMindmap(markdown);
                    
                    // 检查一下解析后的数据，特别是节点的备注信息
                    console.log('即将导入思维导图数据:', mindmapData);
                    
                    if (typeof jm.show !== 'function') {
                        console.error('jm.show 不是一个函数!');
                        alert('jsMind实例未正确初始化，无法导入。');
                        return;
                    }
                    
                    // 手动遍历并为根节点的所有子节点(和子节点的子节点)附加data对象
                    // 这是为了确保jsMind不会丢弃我们的data对象
                    const ensureDataObjects = (nodes) => {
                        if (!nodes) return;
                        nodes.forEach(node => {
                            if (!node.data) node.data = {};
                            if (node.children) ensureDataObjects(node.children);
                        });
                    };
                    
                    ensureDataObjects(mindmapData.data.children);
                    
                    // 确保根节点也有data对象
                    if (!mindmapData.data.data) mindmapData.data.data = {};
                    
                    // 显示思维导图
                    jm.show(mindmapData);
                    
                    // 导入成功后延迟半秒检查思维导图的备注数据
                    setTimeout(function() {
                        console.log('思维导图加载后检查数据:');
                        if (jm.mind && jm.mind.nodes) {
                            const nodes = jm.mind.nodes;
                            let noteCount = 0;
                            Object.values(nodes).forEach(node => {
                                if (node.data && node.data.note) {
                                    console.log(`节点 "${node.topic}" 保留了备注: "${node.data.note}"`);
                                    noteCount++;
                                }
                            });
                            console.log(`加载后找到 ${noteCount} 个带备注的节点`);
                            
                            // 手动更新节点数据
                            if (noteCount === 0) {
                                console.log('尝试手动重新附加备注数据...');
                                // 查找并附加丢失的备注
                                const reattachNotes = (originalNodes, currentNodes) => {
                                    const findOriginalNode = (id, topic, nodes) => {
                                        for (const node of nodes) {
                                            if ((node.id === id || node.topic === topic) && node.data && node.data.note) {
                                                return node;
                                            }
                                            if (node.children && node.children.length > 0) {
                                                const found = findOriginalNode(id, topic, node.children);
                                                if (found) return found;
                                            }
                                        }
                                        return null;
                                    };
                                    
                                    Object.values(currentNodes).forEach(node => {
                                        // 在原始数据中查找对应节点
                                        const originalNode = findOriginalNode(node.id, node.topic, originalNodes);
                                        if (originalNode && originalNode.data && originalNode.data.note) {
                                            // 重新附加备注
                                            if (!node.data) node.data = {};
                                            node.data.note = originalNode.data.note;
                                            console.log(`手动为节点 "${node.topic}" 附加备注: "${originalNode.data.note}"`);
                                            
                                            // 强制更新节点
                                            jm.update_node(node.id, node.topic, node.data);
                                        }
                                    });
                                };
                                
                                // 递归查找原始思维导图数据中所有节点
                                const getAllNodes = (root) => {
                                    const result = [];
                                    const traverse = (node) => {
                                        result.push(node);
                                        if (node.children) {
                                            node.children.forEach(traverse);
                                        }
                                    };
                                    traverse(root);
                                    return result;
                                };
                                
                                // 获取原始数据中所有节点
                                const originalNodes = getAllNodes(mindmapData.data);
                                
                                // 为当前思维导图中的节点重新附加备注
                                reattachNotes(originalNodes, jm.mind.nodes);
                            }
                        }
                    }, 500);
                    
                    // 导入成功后渲染所有备注标记
                    setTimeout(function() {
                        console.log('导入完成，开始渲染备注标记');
                        if (typeof renderAllNoteMarkers === 'function') {
                            renderAllNoteMarkers();
                        } else if (typeof window.renderAllNoteMarkers === 'function') {
                            window.renderAllNoteMarkers();
                        } else {
                            console.warn('找不到renderAllNoteMarkers函数，无法渲染备注标记');
                        }
                    }, 1000); // 给jsMind一点时间完成节点渲染和数据附加
                    
                    console.log('从Markdown导入成功');
                } catch (err) {
                    console.error('解析Markdown失败:', err);
                    alert('导入失败: ' + err.message);
                }
            };
            
            reader.readAsText(file);
        };
        
        input.click();
    } catch (e) {
        console.error('导入Markdown失败:', e);
        alert('导入失败: ' + e.message);
    }
}

// 解析Markdown为思维导图数据结构
function parseMDToMindmap(markdown) {
    console.log('开始解析Markdown文件');
    
    // 分割为行
    const lines = markdown.split('\n');
    let rootId = 'root';
    let rootTopic = '思维导图';
    
    // 解析标题作为根节点
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.startsWith('# ')) {
            rootTopic = line.substring(2).trim();
            break;
        }
    }
    
    // 创建思维导图基础结构
    const mindmapData = {
        "meta": {
            "name": "jsMind",
            "author": "mindmap_editor",
            "version": "0.2"
        },
        "format": "node_tree",
        "data": {
            "id": rootId,
            "topic": rootTopic,
            "children": []
        }
    };
    
    // 解析Markdown列表为节点结构
    let currentLevel = 0;
    let stack = [{ node: mindmapData.data, level: -1 }];
    let nodeIdCounter = 0;
    let lastNodeIndex = -1; // 用于跟踪最后处理的节点行的索引
    
    // 先收集所有节点行，再处理备注
    let nodeLines = []; // 存储 {index, level, node} 的数组
    
    // 第一遍：收集所有节点行
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        // 跳过标题行
        if (line.startsWith('#')) continue;
        
        // 处理列表项（节点）
        if (line.startsWith('-') || line.startsWith('*')) {
            // 计算当前行的缩进级别
            const leadingSpace = lines[i].search(/[^\s]/);
            const level = Math.floor(leadingSpace / 2);
            
            // 从行中提取节点内容
            const content = line.replace(/^[\s-*]+/, '').trim();
            if (!content) continue;
            
            // 调整堆栈以匹配当前级别
            while (stack.length > 1 && stack[stack.length - 1].level >= level) {
                stack.pop();
            }
            
            // 创建新节点
            const newNode = {
                "id": `md_node_${++nodeIdCounter}`,
                "topic": content,
                "children": [],
                "data": {} // 确保每个节点都有一个data对象
            };
            
            // 将新节点添加到父节点的子节点列表中
            stack[stack.length - 1].node.children.push(newNode);
            
            // 将新节点推入堆栈
            stack.push({ node: newNode, level: level });
            lastNodeIndex = i;
            
            // 存储节点信息以便后续处理备注
            nodeLines.push({
                index: i,
                level: level,
                node: newNode
            });
        }
    }
    
    // 第二遍：处理备注
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        // 处理注释（以>开头的行）
        if (line.startsWith('>')) {
            // 找到此备注行对应的节点
            let targetNode = null;
            let closestNodeIndex = -1;
            let closestNodeLevel = -1;
            
            // 找到此备注行之前的最近节点
            for (let j = nodeLines.length - 1; j >= 0; j--) {
                const nodeLine = nodeLines[j];
                
                // 备注行之前的节点
                if (nodeLine.index < i) {
                    // 找与备注行缩进最接近的父节点
                    const noteLeadingSpace = lines[i].search(/[^\s]/);
                    const noteLevel = Math.floor(noteLeadingSpace / 2);
                    
                    // 节点比备注多缩进一级，或缩进相同
                    if (nodeLine.level >= noteLevel - 1) {
                        if (closestNodeIndex === -1 || 
                            nodeLine.index > closestNodeIndex || 
                            (nodeLine.index === closestNodeIndex && nodeLine.level > closestNodeLevel)) {
                            closestNodeIndex = nodeLine.index;
                            closestNodeLevel = nodeLine.level;
                            targetNode = nodeLine.node;
                        }
                    }
                }
            }
            
            // 如果找到目标节点，处理备注
            if (targetNode) {
                let noteText = line.replace(/^>/, '').trim(); // 获取移除'>'并修剪后的原始内容
                
                const appSpecificPrefix = "*注释: "; // 程序添加的特定前缀，包含星号和空格
                const appSpecificSuffix = "*";       // 程序添加的特定后缀星号
                
                // 检查是否符合程序导出的特定格式 "*注释: CONTENT*"
                if (noteText.toLowerCase().startsWith(appSpecificPrefix.toLowerCase()) &&
                    noteText.endsWith(appSpecificSuffix) &&
                    noteText.length >= (appSpecificPrefix.length + appSpecificSuffix.length)) {
                    // 如果是，则提取前缀和后缀之间的内容
                    noteText = noteText.substring(
                        appSpecificPrefix.length,
                        noteText.length - appSpecificSuffix.length
                    ).trim();
                }
                
                // 确保节点的data对象已初始化
                if (!targetNode.data) {
                    targetNode.data = {};
                }
                
                // 附加备注到节点
                targetNode.data.note = noteText;
                
                console.log(`已将备注 "${noteText}" 添加到节点 "${targetNode.topic}"`, targetNode);
            } else {
                console.warn(`找不到备注行 "${line}" 对应的节点`);
            }
        }
    }
    
    // 打印所有带备注的节点，用于调试
    let notesCount = 0;
    const checkNodesWithNotes = (nodes) => {
        nodes.forEach(node => {
            if (node.data && node.data.note) {
                console.log(`节点 "${node.topic}" 有备注: "${node.data.note}"`);
                notesCount++;
            }
            if (node.children && node.children.length > 0) {
                checkNodesWithNotes(node.children);
            }
        });
    };
    
    console.log('检查解析后的节点备注:');
    if (mindmapData.data.children && mindmapData.data.children.length > 0) {
        checkNodesWithNotes(mindmapData.data.children);
    }
    console.log(`找到 ${notesCount} 个带备注的节点`);
    
    console.log('Markdown解析完成，节点数量:', nodeLines.length);
    return mindmapData;
}

// 渲染所有备注标记
function renderAllNoteMarkers() {
    if (!jm || !jm.mind || !jm.mind.nodes) {
        console.warn('jsMind实例未就绪，无法渲染备注标记');
        return;
    }
    
    try {
        console.log('开始渲染所有备注标记...');
        
        // 清理所有现有的备注图标和提示框
        console.log('清理现有备注标记...');
        document.querySelectorAll('.note-tooltip').forEach(tooltip => {
            tooltip.remove();
        });
        document.querySelectorAll('.note-indicator').forEach(indicator => {
            indicator.remove();
        });
        
        // 获取所有节点对象
        const nodes = jm.mind.nodes;
        let noteCount = 0;
        
        console.log(`开始处理${Object.keys(nodes).length}个节点...`);
        
        // 先检查一下节点数据，输出调试信息
        Object.values(nodes).forEach((node, index) => {
            console.log(`检查节点 #${index+1}: ID=${node.id}, 主题=${node.topic}, 有data对象=${!!node.data}, 有备注=${!!(node.data && node.data.note)}`);
            if (node.data && node.data.note) {
                console.log(`- 备注内容: "${node.data.note}"`);
            }
        });
        
        // 遍历所有节点
        Object.values(nodes).forEach((node, index) => {
            // 更严格的检查: 节点必须有data对象且data.note必须存在且不为空字符串
            if (node && node.data && node.data.note && node.data.note.trim() !== '') {
                console.log(`处理第${index+1}个节点: ${node.id} (${node.topic}), 备注: "${node.data.note}"`);
                addNoteMarker(node);
                noteCount++;
            }
        });
        
        console.log(`所有备注标记已渲染，共添加了${noteCount}个备注图标`);
    } catch (e) {
        console.error('渲染备注标记失败:', e);
    }
}

// 更新所有关联线位置
function updateRelationLines() {
    console.log('更新关联线位置');
}
