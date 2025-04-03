// 思维导图功能和工具栏相关

// 全局状态变量
let nodeSummaries = {}; // 保存节点摘要
let relationStartNode = null; // 关联线起始节点
let relationLines = []; // 保存关联线信息

// 注意：jm和selectedNode变量已在core.js中定义，此处不再重复定义

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
    
    // 定义按钮和分隔符创建函数
    const createButton = (id, textKey, titleKey, handler) => {
        const btn = document.createElement('button');
        btn.className = 'btn';
        btn.id = id;
        
        // 使用翻译函数获取文本
        const text = translate(textKey);
        const title = translate(titleKey) || text;
        
        btn.textContent = text;
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
    
    // 添加基本操作按钮
    toolbar.appendChild(createButton('add_node', 'add_node', 'add_node', addNode));
    toolbar.appendChild(createButton('edit_node', 'edit_node', 'edit_node', editNode));
    toolbar.appendChild(createButton('delete_node', 'delete_node', 'delete_node', deleteNode));
    toolbar.appendChild(createButton('expand_all', 'expand_all', 'expand_all', () => jm.expand_all()));
    toolbar.appendChild(createButton('collapse_all', 'collapse_all', 'collapse_all', () => jm.collapse_all()));
    
    // 添加主题选择器
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
    
    toolbar.appendChild(themeSelect);
    
    // 添加分隔符
    toolbar.appendChild(createSeparator());
    
    // 添加高级功能按钮
    toolbar.appendChild(createButton('latex_button', 'formula', 'formula', openLatexEditor));
    toolbar.appendChild(createButton('note_button', 'note', 'note', openNoteEditor));
    // toolbar.appendChild(createButton('relation_button', 'relation_line', 'relation_line', startRelationLine));
    // toolbar.appendChild(createButton('summary_button', 'summary', 'summary', openSummaryEditor));
    // 摘要和关联线功能暂时关掉 后面慢慢写
    // 添加分隔符
    toolbar.appendChild(createSeparator());
    
    // 创建保存按钮组（带下拉菜单）
    const saveGroup = document.createElement('div');
    saveGroup.className = 'btn-group';
    
    // 主保存按钮
    const saveBtn = createButton('save_map', 'save_mindmap', 'save_mindmap');
    saveBtn.onclick = function() {
        // 切换下拉菜单的显示状态
        const dropdown = document.getElementById('save_dropdown');
        dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
    };
    
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
    toolbar.appendChild(saveGroup);
    
    // 加载按钮组
    const loadGroup = document.createElement('div');
    loadGroup.className = 'btn-group';
    
    // 加载按钮
    const loadBtn = createButton('load_map', 'load_mindmap', 'load_mindmap');
    loadBtn.onclick = function() {
        // 切换下拉菜单的显示状态
        const dropdown = document.getElementById('load_dropdown');
        dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
    };
    
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
    toolbar.appendChild(loadGroup);
    
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
            markdown += `${indent}  > *注释: ${node.data.note.replace(/\n/g, '\n' + indent + '  > ')}*\n`;
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
                    jm.show(mindmapData);
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
    let currentNote = null;
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        // 跳过标题行
        if (line.startsWith('#')) continue;
        
        // 处理列表项
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
                "children": []
            };
            
            // 将新节点添加到父节点的子节点列表中
            stack[stack.length - 1].node.children.push(newNode);
            
            // 将新节点推入堆栈
            stack.push({ node: newNode, level: level });
            currentNote = null;
        }
        // 处理注释（以>开头的行）
        else if (line.startsWith('>') && stack.length > 1) {
            const noteText = line.replace(/^>/, '').trim();
            const currentNode = stack[stack.length - 1].node;
            
            if (!currentNode.data) {
                currentNode.data = {};
            }
            
            if (!currentNode.data.note) {
                currentNode.data.note = noteText;
            } else {
                currentNode.data.note += '\n' + noteText;
            }
        }
    }
    
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
        
        // 遍历所有节点
        Object.values(nodes).forEach((node, index) => {
            if (node && node.data && node.data.note) {
                console.log(`处理第${index+1}个节点: ${node.id} (${node.topic})`);
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
