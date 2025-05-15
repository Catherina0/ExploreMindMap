// 思维导图导入导出相关功能

// 保存为JSON
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
        alert(window.i18n && typeof window.i18n.t === 'function' ? 
            window.i18n.t('save_success', 'JSON') : '保存为JSON成功');
    }
}

// 加载思维导图
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

// 导出为Markdown
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

// 从Markdown导入思维导图
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
                    
                    // 检查解析后的数据
                    console.log('即将导入思维导图数据:', mindmapData);
                    
                    if (typeof jm.show !== 'function') {
                        console.error('jm.show 不是一个函数!');
                        alert('jsMind实例未正确初始化，无法导入。');
                        return;
                    }
                    
                    // 手动遍历并为根节点的所有子节点附加data对象
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
                    }, 1000);
                    
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
                
                console.log(`已将备注 "${noteText}" 添加到节点 "${targetNode.topic}"`);
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
    
    if (mindmapData.data.children && mindmapData.data.children.length > 0) {
        checkNodesWithNotes(mindmapData.data.children);
    }
    console.log(`找到 ${notesCount} 个带备注的节点`);
    
    return mindmapData;
}

// 导出成员到全局
window.saveAsJson = saveAsJson;
window.loadMindMap = loadMindMap;
window.exportToMarkdown = exportToMarkdown;
window.importFromMarkdown = importFromMarkdown; 