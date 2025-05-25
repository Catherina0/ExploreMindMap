// 思维导图修改功能模块
// 该模块包含所有与思维导图修改相关的功能

// 应用AI建议到思维导图
function applyAISuggestions(modifications) {
    console.log('正在应用思维导图修改:', modifications);
    
    // 如果没有选中节点，尝试使用根节点
    if (!selectedNode && jm && jm.mind && jm.mind.root) {
        console.log('未选中节点，使用根节点');
        selectedNode = jm.mind.root;
    }
    
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
                    
                    // 特殊处理根节点
                    if (nodeObj.id === 'root') {
                        console.log('正在修改根节点内容');
                        // 确保根节点的其他属性保持不变
                        const rootData = {
                            id: 'root',
                            topic: mod.topic,
                            direction: nodeObj.direction || 'right',
                            expanded: true,
                            children: nodeObj.children || []
                        };
                        // 更新根节点
                        jm.update_node('root', rootData.topic);
                        console.log('根节点修改完成:', rootData);
                    } else {
                        // 非根节点的普通更新
                    jm.update_node(nodeObj.id, mod.topic);
                    }
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
        if (typeof addMessage === 'function') {
            addMessage('ai', `已应用以下修改:\n${modificationLog.join('\n')}`);
        }
        
        return modificationLog.join('\n');
        
    } catch (error) {
        console.error('应用修改失败:', error);
        if (typeof addMessage === 'function') {
            addMessage('ai', `应用修改时出错: ${error.message}`);
        }
        throw error;
    }
}

// 解析AI返回的JSON数据
function parseAIResponse(content) {
    console.log('解析AI响应...');
    let modifications = null;
    
    try {
        // 首先尝试直接解析整个内容
        if (content.trim().startsWith('[') && content.trim().endsWith(']')) {
            modifications = JSON.parse(content);
            console.log('成功直接解析修改建议:', modifications);
            return { success: true, modifications };
        }
    } catch (e) {
        console.log('直接解析失败，尝试提取JSON部分:', e);
    }
    
    // 如果直接解析失败，尝试提取JSON部分
    if (!modifications) {
        // 提取JSON
        const trimmedContent = content.trim();
        const jsonMatch = trimmedContent.match(/\[\s*{.*}\s*\]/s);
        
        if (jsonMatch) {
            const jsonStr = jsonMatch[0];
            try {
                modifications = JSON.parse(jsonStr);
                console.log('成功提取并解析修改建议:', modifications);
                return { success: true, modifications };
            } catch (e) {
                console.error('JSON解析失败:', e, '\n原始JSON字符串:', jsonStr);
                return { 
                    success: false, 
                    error: `JSON格式无效: ${e.message}`,
                    jsonStr 
                };
            }
        } else {
            return { 
                success: false, 
                error: '返回内容中未找到有效的JSON格式',
                content 
            };
        }
    }
    
    return { success: false, error: '未知解析错误' };
}

// 生成唯一ID
function generateUniqueID() {
    return 'node_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
}

// 导出函数供其他模块使用
window.mindmapModifier = {
    applyAISuggestions,
    parseAIResponse,
    generateUniqueID
}; 