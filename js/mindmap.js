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
    
    // 定义按钮和分隔符创建函数
    const createButton = (id, text, title, handler) => {
        const btn = document.createElement('button');
        btn.className = 'btn';
        btn.id = id;
        btn.textContent = text;
        btn.title = title || text;
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
    toolbar.appendChild(createButton('add_node', '添加节点', '添加新节点', addNode));
    toolbar.appendChild(createButton('edit_node', '编辑节点', '编辑选中节点', editNode));
    toolbar.appendChild(createButton('delete_node', '删除节点', '删除选中节点', deleteNode));
    toolbar.appendChild(createButton('expand_all', '展开全部', '展开所有节点', () => jm.expand_all()));
    toolbar.appendChild(createButton('collapse_all', '折叠全部', '折叠所有节点', () => jm.collapse_all()));
    
    // 添加主题选择器
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
    
    themeSelect.addEventListener('change', function() {
        jm.set_theme(this.value);
    });
    
    toolbar.appendChild(themeSelect);
    
    // 添加分隔符
    toolbar.appendChild(createSeparator());
    
    // 添加高级功能按钮
    toolbar.appendChild(createButton('latex_button', '公式', '插入LaTeX公式', openLatexEditor));
    toolbar.appendChild(createButton('note_button', '备注', '添加节点备注', openNoteEditor));
    toolbar.appendChild(createButton('relation_button', '关联线', '创建节点间关联', startRelationLine));
    // toolbar.appendChild(createButton('summary_button', '摘要', '为节点添加摘要', openSummaryEditor));
    
    // 添加分隔符
    toolbar.appendChild(createSeparator());
    
    // 创建保存按钮组（带下拉菜单）
    const saveGroup = document.createElement('div');
    saveGroup.className = 'btn-group';
    
    // 主保存按钮
    const saveBtn = createButton('save_map', '保存', '保存思维导图');
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
    saveJsonOption.textContent = '保存为JSON';
    saveJsonOption.onclick = function(e) {
        e.preventDefault();
        saveAsJson();
        saveDropdown.style.display = 'none';
    };
    
    // 添加MD保存选项
    const saveMdOption = document.createElement('a');
    saveMdOption.href = '#';
    saveMdOption.textContent = '导出为Markdown';
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
    const loadBtn = createButton('load_map', '加载', '加载思维导图');
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
    loadJsonOption.textContent = '加载JSON文件';
    loadJsonOption.onclick = function(e) {
        e.preventDefault();
        loadMindMap();
        loadDropdown.style.display = 'none';
    };
    
    // 添加Markdown导入选项
    const loadMdOption = document.createElement('a');
    loadMdOption.href = '#';
    loadMdOption.textContent = '导入Markdown';
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
        // 只有当节点有备注时才添加标记
        if (!node || !node.data || !node.data.note) return;
        
        // 获取节点DOM元素
        const nodeElement = document.querySelector(`jmnode[nodeid="${node.id}"]`);
        if (!nodeElement) return;
        
        // 检查是否已有标记
        if (nodeElement.querySelector('.note-indicator')) return;
        
        // 获取节点内容元素
        const topicElement = nodeElement.querySelector('.topic');
        if (!topicElement) return;
        
        // 创建备注指示器按钮（使用SVG）
        const noteIndicator = document.createElement('span');
        noteIndicator.className = 'note-indicator';
        noteIndicator.style.marginLeft = '4px';
        noteIndicator.style.cursor = 'pointer';
        noteIndicator.style.display = 'inline-block';
        noteIndicator.style.verticalAlign = 'middle';
        noteIndicator.style.width = '16px';
        noteIndicator.style.height = '16px';
        
        // 创建SVG图标
        const svgNS = "http://www.w3.org/2000/svg";
        const svg = document.createElementNS(svgNS, "svg");
        svg.setAttribute("width", "16");
        svg.setAttribute("height", "16");
        svg.setAttribute("viewBox", "0 0 24 24");
        svg.style.fill = "#4285f4";
        
        // 创建备注图标路径
        const path = document.createElementNS(svgNS, "path");
        path.setAttribute("d", "M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zm-2-7H7v-2h10v2zm-4 4H7v-2h6v2z");
        
        svg.appendChild(path);
        noteIndicator.appendChild(svg);
        
        // 创建悬浮提示框
        const tooltip = document.createElement('div');
        tooltip.className = 'note-tooltip';
        tooltip.textContent = node.data.note;
        tooltip.dataset.nodeId = node.id;
        tooltip.style.position = 'absolute';
        tooltip.style.zIndex = '1000';
        tooltip.style.backgroundColor = '#fff';
        tooltip.style.border = '1px solid #ddd';
        tooltip.style.borderRadius = '4px';
        tooltip.style.padding = '8px 12px';
        tooltip.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
        tooltip.style.maxWidth = '250px';
        tooltip.style.maxHeight = '150px';
        tooltip.style.overflow = 'auto';
        tooltip.style.display = 'none';
        tooltip.style.whiteSpace = 'pre-wrap';
        tooltip.style.fontSize = '14px';
        tooltip.style.lineHeight = '1.4';
        
        // 鼠标悬停时显示提示框
        noteIndicator.addEventListener('mouseover', function(e) {
            // 获取节点位置
            const nodeRect = nodeElement.getBoundingClientRect();
            const indicatorRect = noteIndicator.getBoundingClientRect();
            
            // 定位在节点下方
            tooltip.style.top = (nodeRect.bottom + 5) + 'px';
            tooltip.style.left = (indicatorRect.left) + 'px';
            tooltip.style.display = 'block';
            
            // 检查是否超出视口边界并调整位置
            setTimeout(() => {
                const tooltipRect = tooltip.getBoundingClientRect();
                const viewportWidth = window.innerWidth;
                
                if (tooltipRect.right > viewportWidth) {
                    tooltip.style.left = (viewportWidth - tooltipRect.width - 10) + 'px';
                }
            }, 0);
        });
        
        // 鼠标移出时隐藏提示框
        noteIndicator.addEventListener('mouseout', function() {
            tooltip.style.display = 'none';
        });
        
        // 将提示框添加到body
        document.body.appendChild(tooltip);
        
        // 将指示器添加到节点内容后
        topicElement.appendChild(noteIndicator);
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
        alert('请先选择一个节点');
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
                    alert('无法添加节点: 无法从ID获取节点对象');
                    return;
                }
            } else {
                alert('无法添加节点: 选中节点没有有效ID');
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
                alert('无法添加节点: 找不到父节点且无法获取根节点');
                return;
            }
            
            // 提示用户选择是使用根节点还是取消操作
            if (confirm('找不到当前选中的节点。是否要在根节点下添加新节点？')) {
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
            alert('严重错误: 无法获取有效的父节点');
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
        jm.add_node(actualParentNode, newNodeId, '新节点');
        console.log('节点添加成功');
    } catch (e) {
        console.error('添加节点失败:', e);
        alert('添加节点失败: ' + e.message);
    }
}

function editNode() {
    console.log('编辑节点...');
    
    if (!selectedNode) {
        alert('请先选择一个节点');
        return;
    }
    
    try {
        const newTopic = prompt('请输入新的节点内容:', selectedNode.topic);
        if (newTopic !== null) {
            // 检查节点ID是否有效
            if (!selectedNode.id || typeof selectedNode.id !== 'string') {
                console.error('选中节点没有有效ID:', selectedNode);
                alert('无法编辑节点: 选中节点没有有效ID');
                return;
            }
            
            jm.update_node(selectedNode.id, newTopic);
            console.log('节点编辑成功:', newTopic);
        }
    } catch (e) {
        console.error('编辑节点失败:', e);
        alert('编辑节点失败: ' + e.message);
    }
}

function deleteNode() {
    console.log('删除节点...');
    
    if (!selectedNode) {
        alert('请先选择一个节点');
        return;
    }
    
    try {
        // 检查节点ID是否有效
        if (!selectedNode.id || typeof selectedNode.id !== 'string') {
            console.error('选中节点没有有效ID:', selectedNode);
            alert('无法删除节点: 选中节点没有有效ID');
            return;
        }
        
        // 检查是否为根节点
        if (selectedNode.id === 'root') {
            alert('不能删除根节点');
            return;
        }
        
        if (confirm('确定要删除此节点及其所有子节点吗？')) {
            const nodeId = selectedNode.id;
            jm.remove_node(nodeId);
            selectedNode = null;
            console.log('节点删除成功:', nodeId);
        }
    } catch (e) {
        console.error('删除节点失败:', e);
        alert('删除节点失败: ' + e.message);
    }
}

// LaTeX相关函数
function openLatexEditor() {
    console.log('打开公式编辑器');
    if (!selectedNode) {
        alert('请先选择一个节点');
        return;
    }
    
    if (typeof window.showLatexEditor === 'function') {
        window.showLatexEditor(selectedNode);
    } else {
        alert('公式编辑器未就绪');
    }
}

// 关联线相关函数
function startRelationLine() {
    if (!selectedNode) {
        alert('请先选择一个起始节点');
        return;
    }
    
    relationStartNode = selectedNode;
    alert(`已选择起始节点: "${relationStartNode.topic}"\n现在请选择目标节点`);
}

// 摘要相关函数
function openSummaryEditor() {
    if (!selectedNode) {
        alert('请先选择一个节点');
        return;
    }
    
    console.log('打开摘要编辑器');
    const editor = document.getElementById('summary_editor');
    if (!editor) {
        alert('摘要编辑器未找到');
        return;
    }
    
    const summaryInput = document.getElementById('node_summary');
    if (!summaryInput) {
        alert('摘要输入框未找到');
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
        alert('请先选择一个节点');
        return;
    }
    
    const editor = document.getElementById('note_editor');
    if (!editor) {
        alert('备注编辑器未找到');
        return;
    }
    
    const noteInput = document.getElementById('node_note');
    if (!noteInput) {
        alert('备注输入框未找到');
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
        alert('保存失败: ' + e.message);
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
        // 清理所有现有的提示框
        document.querySelectorAll('.note-tooltip').forEach(tooltip => {
            tooltip.remove();
        });
        
        // 遍历所有节点
        Object.values(jm.mind.nodes).forEach(node => {
            if (node && node.data && node.data.note) {
                addNoteMarker(node);
            }
        });
        
        console.log('所有备注标记已渲染');
    } catch (e) {
        console.error('渲染备注标记失败:', e);
    }
}

// 更新所有关联线位置
function updateRelationLines() {
    console.log('更新关联线位置');
}
