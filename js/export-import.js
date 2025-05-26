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

// 导出问题反馈日志
function exportFeedbackLog() {
    try {
        console.log('开始导出问题反馈日志');
        
        // 手动收集当前运行时错误
        collectRuntimeErrors();
        
        // 收集信息
        const feedbackData = collectFeedbackData();
        
        // 格式化为可读性好的文本
        const formattedLog = formatFeedbackLog(feedbackData);
        
        // 创建并下载日志文件
        const blob = new Blob([formattedLog], {type: "text/plain;charset=utf-8"});
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        a.download = `mindmap-feedback-${timestamp}.log`;
        document.body.appendChild(a);
        a.click();
        
        setTimeout(function() {
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        }, 0);
        
        console.log('成功导出问题反馈日志');
    } catch (e) {
        console.error('导出问题反馈日志失败:', e);
        alert('导出失败: ' + e.message);
        
        // 尝试保存一个最小化的错误信息
        try {
            const minimalErrorLog = `
======= 最小化错误日志 =======
时间: ${new Date().toISOString()}
错误: ${e.message}
堆栈: ${e.stack || '未知'}
浏览器: ${navigator.userAgent}
`;
            const errorBlob = new Blob([minimalErrorLog], {type: "text/plain;charset=utf-8"});
            const errorUrl = URL.createObjectURL(errorBlob);
            
            const errorLink = document.createElement('a');
            errorLink.href = errorUrl;
            errorLink.download = `error-log-${Date.now()}.txt`;
            document.body.appendChild(errorLink);
            errorLink.click();
            
            setTimeout(function() {
                document.body.removeChild(errorLink);
                window.URL.revokeObjectURL(errorUrl);
            }, 0);
        } catch (innerError) {
            console.error('保存最小化错误日志失败:', innerError);
        }
    }
}

// 手动收集当前运行时错误
function collectRuntimeErrors() {
    try {
        // 收集任何可能的JavaScript运行时错误
        if (!window.consoleErrors) {
            window.consoleErrors = [];
        }
        
        if (!window.uncaughtErrors) {
            window.uncaughtErrors = [];
        }
        
        // 尝试检测当前页面状态和变量
        const currentState = {
            timestamp: new Date().toISOString(),
            message: '手动收集的页面状态',
            type: 'manual_check'
        };
        
        // 检测jsMind实例
        if (typeof jm === 'undefined' || !jm) {
            currentState.jsmindError = 'jsMind实例不存在或未初始化';
        } else if (!jm.mind) {
            currentState.jsmindError = 'jsMind实例存在但mind属性不存在';
        }
        
        // 检测DOM元素
        try {
            const container = document.getElementById('jsmind_container');
            if (!container) {
                currentState.domError = 'jsmind_container元素不存在';
            }
            
            const chatContainer = document.querySelector('.chat-container');
            if (!chatContainer) {
                if (!currentState.domError) currentState.domError = '';
                currentState.domError += ' chat-container元素不存在';
            }
        } catch (e) {
            currentState.domError = `检测DOM时出错: ${e.message}`;
        }
        
        // 添加到错误日志
        window.consoleErrors.push(currentState);
        
        console.log('已手动收集运行时错误信息');
    } catch (e) {
        console.error('手动收集运行时错误失败:', e);
    }
}

// 收集反馈所需的所有信息
function collectFeedbackData() {
    const data = {
        timestamp: new Date().toISOString(),
        mindmap: null,
        chatHistory: [],
        apiStats: [],
        browserInfo: {},
        sessionInfo: {},
        networkInfo: {},
        chatModeHistory: [], // 添加聊天模式历史
        osInfo: {}, // 添加操作系统信息
        errorLogs: [] // 添加错误日志
    };
    
    // 收集思维导图数据
    try {
        if (jm && typeof jm.get_data === 'function') {
            data.mindmap = jm.get_data();
        }
    } catch (e) {
        console.error('收集思维导图数据失败:', e);
        data.mindmapError = e.message;
    }
    
    // 收集对话历史
    try {
        // 查找聊天消息容器
        const chatMessages = document.getElementById('chat_messages');
        if (chatMessages) {
            // 从DOM中提取对话
            const messages = chatMessages.querySelectorAll('.message');
            messages.forEach(msg => {
                const isAi = msg.classList.contains('ai-message');
                const text = msg.textContent.trim();
                const timestamp = msg.getAttribute('data-timestamp') || '';
                
                data.chatHistory.push({
                    type: isAi ? 'ai' : 'user',
                    text: text,
                    timestamp: timestamp
                });
            });
        }
        
        // 如果全局有保存对话历史的变量，也一并收集
        if (window.aiAssistant && window.aiAssistant.chatHistory) {
            data.chatHistoryFromMemory = window.aiAssistant.chatHistory;
        }
    } catch (e) {
        console.error('收集对话历史失败:', e);
        data.chatHistoryError = e.message;
    }
    
    // 收集API调用统计
    try {
        // 如果存在API调用统计数据则收集
        if (window.apiStats) {
            data.apiStats = window.apiStats;
        } else {
            // 尝试从console记录中提取相关信息
            if (window.apiRequestTimes) {
                data.apiStats = window.apiRequestTimes;
            }
        }
        
        // 从localStorage中查找可能的API状态信息
        const storedApiStatus = localStorage.getItem('api_status');
        if (storedApiStatus) {
            try {
                data.storedApiStatus = JSON.parse(storedApiStatus);
            } catch (e) {
                data.storedApiStatus = storedApiStatus;
            }
        }
    } catch (e) {
        console.error('收集API统计数据失败:', e);
        data.apiStatsError = e.message;
    }
    
    // 收集浏览器信息
    try {
        data.browserInfo = {
            userAgent: navigator.userAgent,
            language: navigator.language,
            platform: navigator.platform,
            vendor: navigator.vendor,
            cookieEnabled: navigator.cookieEnabled,
            doNotTrack: navigator.doNotTrack,
            screenWidth: window.screen.width,
            screenHeight: window.screen.height,
            innerWidth: window.innerWidth,
            innerHeight: window.innerHeight,
            devicePixelRatio: window.devicePixelRatio
        };
    } catch (e) {
        console.error('收集浏览器信息失败:', e);
        data.browserInfoError = e.message;
    }
    
    // 收集会话和模式信息
    try {
        data.sessionInfo = {
            currentTime: new Date().toString(),
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            locale: Intl.DateTimeFormat().resolvedOptions().locale
        };
        
        // 获取当前AI对话模式
        const aiToggleBtn = document.getElementById('ai_toggle');
        if (aiToggleBtn) {
            data.sessionInfo.currentAiMode = aiToggleBtn.textContent.trim();
        }
        
        // 获取选择的AI服务类型
        const aiService = document.getElementById('ai_service');
        if (aiService) {
            data.sessionInfo.selectedAiService = aiService.value;
        }
        
        // 获取当前语言设置
        if (window.i18n && typeof window.i18n.getCurrentLanguage === 'function') {
            data.sessionInfo.currentLanguage = window.i18n.getCurrentLanguage();
        } else {
            const currentLangSpan = document.getElementById('current_lang');
            if (currentLangSpan) {
                data.sessionInfo.displayedLanguage = currentLangSpan.textContent.trim();
            }
        }
    } catch (e) {
        console.error('收集会话信息失败:', e);
        data.sessionInfoError = e.message;
    }
    
    // 收集网络信息
    try {
        // 基本连接信息
        data.networkInfo = {
            online: navigator.onLine
        };
        
        // 如果浏览器支持NetworkInformation API
        if (navigator.connection) {
            data.networkInfo.connection = {
                effectiveType: navigator.connection.effectiveType,
                downlink: navigator.connection.downlink,
                rtt: navigator.connection.rtt,
                saveData: navigator.connection.saveData
            };
        }
        
        // 收集性能数据
        if (window.performance) {
            const perfData = window.performance.timing;
            if (perfData) {
                data.networkInfo.performance = {
                    domainLookupTime: perfData.domainLookupEnd - perfData.domainLookupStart,
                    connectTime: perfData.connectEnd - perfData.connectStart,
                    responseTime: perfData.responseEnd - perfData.responseStart,
                    domProcessingTime: perfData.domComplete - perfData.domLoading,
                    pageLoadTime: perfData.loadEventEnd - perfData.navigationStart
                };
            }
            
            // 收集资源加载性能
            if (window.performance.getEntriesByType) {
                const resources = window.performance.getEntriesByType('resource');
                // 只保留API相关的资源加载信息
                data.networkInfo.apiResources = resources
                    .filter(resource => 
                        resource.name.includes('api') || 
                        resource.name.includes('openai') || 
                        resource.name.includes('deepseek') ||
                        resource.name.includes('azure'))
                    .map(resource => ({
                        name: resource.name,
                        duration: resource.duration,
                        startTime: resource.startTime,
                        responseEnd: resource.responseEnd
                    }));
            }
        }
    } catch (e) {
        console.error('收集网络信息失败:', e);
        data.networkInfoError = e.message;
    }
    
    // 收集聊天模式历史
    try {
        if (window.chatModeHistory && Array.isArray(window.chatModeHistory)) {
            data.chatModeHistory = window.chatModeHistory;
        }
    } catch (e) {
        console.error('收集聊天模式历史失败:', e);
        data.chatModeHistoryError = e.message;
    }
    
    // 收集操作系统信息
    try {
        // 基本系统信息
        data.osInfo = {
            platform: navigator.platform,
            userAgent: navigator.userAgent,
            // 尝试解析用户代理获取更多信息
            osName: getOSName(),
            osVersion: getOSVersion(),
            cpuCores: navigator.hardwareConcurrency || 'unknown',
            deviceMemory: navigator.deviceMemory ? `${navigator.deviceMemory} GB` : 'unknown',
            touchPoints: navigator.maxTouchPoints || 0,
            prefersDarkMode: window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches,
            pixelRatio: window.devicePixelRatio || 1
        };
        
        // 尝试获取屏幕方向信息
        if (window.screen && window.screen.orientation) {
            data.osInfo.screenOrientation = window.screen.orientation.type;
        }
        
        console.log('收集操作系统信息成功');
    } catch (e) {
        console.error('收集操作系统信息失败:', e);
        data.osInfoError = e.message;
    }
    
    // 收集错误日志
    try {
        // 从控制台错误中收集
        if (window.consoleErrors && Array.isArray(window.consoleErrors)) {
            data.errorLogs = window.consoleErrors;
        }
        
        // 收集未捕获的异常
        if (window.uncaughtErrors && Array.isArray(window.uncaughtErrors)) {
            data.uncaughtErrors = window.uncaughtErrors;
        }
        
        console.log('收集错误日志成功');
    } catch (e) {
        console.error('收集错误日志失败:', e);
        data.errorLogsError = e.message;
    }
    
    return data;
}

// 辅助函数 - 获取操作系统名称
function getOSName() {
    const userAgent = window.navigator.userAgent;
    let osName = "未知";
    
    if (userAgent.indexOf("Windows NT") !== -1) {
        osName = "Windows";
    } else if (userAgent.indexOf("Mac OS X") !== -1) {
        osName = "macOS";
    } else if (userAgent.indexOf("Linux") !== -1) {
        osName = "Linux";
    } else if (userAgent.indexOf("iPhone") !== -1) {
        osName = "iOS";
    } else if (userAgent.indexOf("iPad") !== -1) {
        osName = "iPadOS";
    } else if (userAgent.indexOf("Android") !== -1) {
        osName = "Android";
    }
    
    return osName;
}

// 辅助函数 - 获取操作系统版本
function getOSVersion() {
    const userAgent = window.navigator.userAgent;
    let osVersion = "未知";
    
    // Windows
    if (userAgent.indexOf("Windows NT") !== -1) {
        const ntVersion = userAgent.match(/Windows NT (\d+\.\d+)/);
        if (ntVersion) {
            const versionMap = {
                "10.0": "Windows 10/11",
                "6.3": "Windows 8.1",
                "6.2": "Windows 8",
                "6.1": "Windows 7",
                "6.0": "Windows Vista",
                "5.2": "Windows XP x64",
                "5.1": "Windows XP",
                "5.0": "Windows 2000"
            };
            osVersion = versionMap[ntVersion[1]] || `Windows NT ${ntVersion[1]}`;
        }
    } 
    // macOS
    else if (userAgent.indexOf("Mac OS X") !== -1) {
        const macVersion = userAgent.match(/Mac OS X (\d+[._]\d+[._]?\d*)/);
        if (macVersion) {
            osVersion = `macOS ${macVersion[1].replace(/_/g, '.')}`;
        }
    } 
    // iOS/iPadOS
    else if (userAgent.indexOf("iPhone OS") !== -1 || userAgent.indexOf("iPad") !== -1) {
        const iosVersion = userAgent.match(/OS (\d+[._]\d+[._]?\d*)/);
        if (iosVersion) {
            osVersion = `iOS ${iosVersion[1].replace(/_/g, '.')}`;
        }
    } 
    // Android
    else if (userAgent.indexOf("Android") !== -1) {
        const androidVersion = userAgent.match(/Android (\d+[._]\d+[._]?\d*)/);
        if (androidVersion) {
            osVersion = `Android ${androidVersion[1]}`;
        }
    } 
    // Linux
    else if (userAgent.indexOf("Linux") !== -1) {
        osVersion = "Linux";
        // 尝试获取更具体的Linux发行版
        if (userAgent.indexOf("Ubuntu") !== -1) {
            osVersion += " (Ubuntu)";
        } else if (userAgent.indexOf("Fedora") !== -1) {
            osVersion += " (Fedora)";
        }
    }
    
    return osVersion;
}

// 格式化反馈数据为可读性好的文本
function formatFeedbackLog(data) {
    let log = `=========== 思维导图AI助手问题反馈日志 ===========\n`;
    log += `生成时间: ${data.timestamp}\n\n`;
    
    // 添加操作系统信息
    log += `===== 操作系统信息 =====\n`;
    if (data.osInfo && Object.keys(data.osInfo).length > 0) {
        for (const [key, value] of Object.entries(data.osInfo)) {
            log += `${key}: ${value}\n`;
        }
    } else {
        log += `无法获取操作系统信息\n`;
    }
    log += '\n';
    
    // 添加浏览器信息
    log += `===== 浏览器信息 =====\n`;
    for (const [key, value] of Object.entries(data.browserInfo)) {
        log += `${key}: ${value}\n`;
    }
    log += '\n';
    
    // 添加会话信息
    log += `===== 会话信息 =====\n`;
    for (const [key, value] of Object.entries(data.sessionInfo)) {
        log += `${key}: ${value}\n`;
    }
    log += '\n';
    
    // 添加网络信息
    log += `===== 网络信息 =====\n`;
    log += `在线状态: ${data.networkInfo.online}\n`;
    
    if (data.networkInfo.connection) {
        log += `网络类型: ${data.networkInfo.connection.effectiveType}\n`;
        log += `下行链路速度: ${data.networkInfo.connection.downlink} Mbps\n`;
        log += `往返时间: ${data.networkInfo.connection.rtt} ms\n`;
        log += `省流模式: ${data.networkInfo.connection.saveData}\n`;
    }
    
    if (data.networkInfo.performance) {
        log += `\n性能数据:\n`;
        for (const [key, value] of Object.entries(data.networkInfo.performance)) {
            log += `  ${key}: ${value} ms\n`;
        }
    }
    
    if (data.networkInfo.apiResources && data.networkInfo.apiResources.length > 0) {
        log += `\nAPI资源加载性能:\n`;
        data.networkInfo.apiResources.forEach((resource, index) => {
            log += `  [${index + 1}] ${resource.name}\n`;
            log += `      加载时间: ${resource.duration.toFixed(2)} ms\n`;
        });
    }
    log += '\n';
    
    // 添加API统计
    log += `===== API调用统计 =====\n`;
    if (data.apiStats && data.apiStats.length > 0) {
        data.apiStats.forEach((stat, index) => {
            log += `请求 ${index + 1}:\n`;
            for (const [key, value] of Object.entries(stat)) {
                if (typeof value === 'object') {
                    log += `  ${key}:\n`;
                    for (const [subKey, subValue] of Object.entries(value)) {
                        log += `    ${subKey}: ${subValue}\n`;
                    }
                } else {
                    log += `  ${key}: ${value}\n`;
                }
            }
            log += '\n';
        });
    } else {
        log += `无API调用记录\n\n`;
    }
    
    // 添加聊天模式历史
    log += `===== 聊天模式历史 =====\n`;
    if (data.chatModeHistory && data.chatModeHistory.length > 0) {
        data.chatModeHistory.forEach((entry, index) => {
            log += `[${index + 1}] ${entry.timestamp} - 模式: ${entry.mode}\n`;
        });
    } else {
        log += `无聊天模式切换记录\n`;
    }
    log += '\n';
    
    // 添加错误日志
    log += `===== 错误日志 =====\n`;
    if (data.errorLogs && data.errorLogs.length > 0) {
        data.errorLogs.forEach((error, index) => {
            log += `[${index + 1}] ${error.timestamp || '未知时间'}\n`;
            log += `  消息: ${error.message || '未知错误'}\n`;
            if (error.stack) {
                log += `  堆栈: ${error.stack}\n`;
            }
            if (error.url) {
                log += `  URL: ${error.url}\n`;
            }
            log += '\n';
        });
    } else if (data.uncaughtErrors && data.uncaughtErrors.length > 0) {
        data.uncaughtErrors.forEach((error, index) => {
            log += `[${index + 1}] ${error.timestamp || '未知时间'}\n`;
            log += `  消息: ${error.message || '未知错误'}\n`;
            if (error.stack) {
                log += `  堆栈: ${error.stack}\n`;
            }
            if (error.url) {
                log += `  URL: ${error.url}\n`;
            }
            log += '\n';
        });
    } else {
        log += `无错误日志记录\n`;
    }
    log += '\n';
    
    // 添加对话历史
    log += `===== 对话历史 =====\n`;
    if (data.chatHistory && data.chatHistory.length > 0) {
        data.chatHistory.forEach((msg, index) => {
            log += `[${msg.type.toUpperCase()}] ${msg.timestamp || ''}\n`;
            log += `${msg.text}\n\n`;
        });
    } else {
        log += `无对话历史记录\n\n`;
    }
    
    // 添加思维导图数据
    log += `===== 思维导图数据 =====\n`;
    if (data.mindmap) {
        log += JSON.stringify(data.mindmap, null, 2);
    } else {
        log += `无思维导图数据\n`;
    }
    
    return log;
}

// 导出成员到全局
window.saveAsJson = saveAsJson;
window.loadMindMap = loadMindMap;
window.exportToMarkdown = exportToMarkdown;
window.importFromMarkdown = importFromMarkdown;
window.exportFeedbackLog = exportFeedbackLog; 