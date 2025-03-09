// LaTeX公式编辑器相关功能

// 确保全局变量在此处可用
/* 全局变量依赖：
 * selectedNode - 当前选中的节点
 * jm - jsMind实例
 */

// 设置LaTeX编辑器事件
function setupLatexEditorEvents() {
    console.log('设置LaTeX编辑器事件...');
    
    // 设置LaTeX侧边栏关闭按钮事件
    const closeBtns = document.querySelectorAll('#latex_sidebar .sidebar-close');
    closeBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            document.getElementById('latex_sidebar').classList.remove('show');
        });
    });
    
    // 设置完成按钮事件
    const applyBtn = document.getElementById('sidebar_latex_apply');
    if (applyBtn) {
        applyBtn.addEventListener('click', function() {
            const formula = document.getElementById('sidebar_latex_formula').value;
            if (selectedNode) {
                applyLatexFormula(formula);
                document.getElementById('latex_sidebar').classList.remove('show');
            }
        });
    }
    
    // 设置公式输入变化时的预览更新
    const formulaInput = document.getElementById('sidebar_latex_formula');
    if (formulaInput) {
        formulaInput.addEventListener('input', updateSidebarLatexPreview);
    }
    
    // 初始渲染公式示例
    renderFormulaExamples();
    
    console.log('LaTeX编辑器事件设置完成');
}

// 打开LaTeX编辑器
function openLatexEditor() {
    console.log('打开LaTeX编辑器...');
    
    if (!selectedNode) {
        alert('请先选择一个节点');
        return;
    }
    
    // 获取侧边栏
    const sidebar = document.getElementById('latex_sidebar');
    if (!sidebar) {
        console.error('未找到LaTeX侧边栏');
        return;
    }
    
    // 获取表单元素
    const formula = document.getElementById('sidebar_latex_formula');
    if (!formula) {
        console.error('未找到公式输入框');
        return;
    }
    
    // 获取当前节点的公式（如果有）
    const currentFormula = selectedNode.data && selectedNode.data.latex ? selectedNode.data.latex : '';
    formula.value = currentFormula;
    console.log('当前公式:', currentFormula || '无');
    
    // 设置完成按钮事件
    document.getElementById('sidebar_latex_apply').onclick = function() {
        const inputElement = document.getElementById('sidebar_latex_formula');
        applyLatexFormula(inputElement.value);
        sidebar.classList.remove('show');
    };
    
    // 渲染常用公式示例
    renderFormulaExamples();
    
    // 设置常用公式点击事件
    setFormulaExampleClickHandlers();
    
    // 添加输入事件
    formula.oninput = updateSidebarLatexPreview;
    
    // 显示侧边栏并更新预览
    sidebar.classList.add('show');
    updateSidebarLatexPreview();
}

// 清理LaTeX公式文本的通用函数
function cleanLatexText(text) {
    if (!text) return '';
    
    return text
        .replace(/[\u200B-\u200D\uFEFF]/g, '') // 移除零宽字符
        .replace(/⎧|⎨|⎩/g, '') // 移除Unicode花括号字符
        .replace(/[\u2329\u232A\u27E8\u27E9\u2983-\u2986\u2308-\u230B\u2329-\u232A\u3008-\u3009\u3016-\u3017\u3018-\u3019]/g, '') // 移除Unicode括号
        .trim();
}

// 渲染公式示例
function renderFormulaExamples() {
    console.log('渲染公式示例...');
    
    // 先清除所有已有的渲染内容，避免重复渲染
    document.querySelectorAll('.formula-table td:first-child span').forEach(span => {
        // 保存原始文本内容
        if (!span.getAttribute('data-formula')) {
            span.setAttribute('data-formula', span.textContent);
        }
        // 清空内容，准备重新渲染
        span.innerHTML = '';
    });
    
    // 然后重新渲染每个公式
    document.querySelectorAll('.formula-table td:first-child span').forEach(span => {
        try {
            if (window.katex) {
                // 获取原始公式文本
                const formula = span.getAttribute('data-formula');
                if (!formula) return;
                
                // 清理文本
                let cleanText = cleanLatexText(formula);
                
                // 只进行一次渲染
                katex.render(cleanText, span, {
                    throwOnError: false,
                    displayMode: false
                });
            }
        } catch (e) {
            console.error('渲染公式示例错误:', e);
            span.textContent = '公式渲染错误';
        }
    });
}

// 设置公式示例点击处理器
function setFormulaExampleClickHandlers() {
    console.log('设置公式点击处理器...');
    
    // 为每个公式代码单元格添加点击事件
    document.querySelectorAll('.formula-table tr').forEach(row => {
        const codeCell = row.querySelector('td:nth-child(2) code');
        const entireRow = row;
        
        if (codeCell) {
            // 整行可点击
            entireRow.style.cursor = 'pointer';
            entireRow.addEventListener('click', function() {
                // 清理文本
                const formula = cleanLatexText(codeCell.textContent);
                const inputElement = document.getElementById('sidebar_latex_formula');
                
                if (inputElement) {
                    inputElement.value = formula;
                    updateSidebarLatexPreview();
                    // 滚动输入框到顶部
                    inputElement.scrollTop = 0;
                    // 聚焦输入框
                    inputElement.focus();
                }
            });
        }
    });
}

// 更新LaTeX预览
function updateSidebarLatexPreview() {
    console.log('更新公式预览...');
    
    const formulaInput = document.getElementById('sidebar_latex_formula');
    if (!formulaInput) {
        console.error('公式输入框不存在');
        return;
    }
    
    // 清理输入
    const formula = cleanLatexText(formulaInput.value);
    const preview = document.getElementById('sidebar_latex_preview');
    
    if (!preview) {
        console.error('预览区域不存在');
        return;
    }
    
    if (!formula) {
        preview.innerHTML = '<p class="preview-placeholder">预览区域</p>';
        return;
    }
    
    try {
        // 使用KaTeX渲染
        if (window.katex) {
            katex.render(formula, preview, {
                throwOnError: false,
                displayMode: true
            });
        } else {
            preview.innerHTML = '<p>KaTeX库未加载，无法预览</p>';
        }
    } catch (e) {
        console.error('预览公式错误:', e);
        preview.innerHTML = `<p class="error">公式语法错误: ${e.message}</p>`;
    }
}

// 应用LaTeX公式到节点
function applyLatexFormula(formula) {
    console.log('-------------- 开始应用公式到节点 --------------');
    console.log('原始公式输入:', formula);
    
    if (!selectedNode) {
        console.error('错误: 未选择节点');
        alert('请先选择一个节点');
        return;
    }
    
    console.log('当前节点信息:', {
        id: selectedNode.id,
        topic: selectedNode.topic,
        hasData: !!selectedNode.data
    });
    
    try {
        // 清理公式
        const cleanFormula = cleanLatexText(formula);
        console.log('清理后的公式:', cleanFormula);
        
        // 如果公式为空，直接返回
        if (!cleanFormula) {
            console.log('公式为空，不做任何修改');
            return;
        }
        
        // 设置公式到节点数据
        if (!selectedNode.data) {
            selectedNode.data = {};
            console.log('节点data对象不存在，已创建');
        }
        
        // 确保存在originalTopic，保存最原始的内容
        if (!selectedNode.data.originalTopic) {
            selectedNode.data.originalTopic = selectedNode.topic;
            console.log('保存原始内容:', selectedNode.data.originalTopic);
        }
        
        // 添加LaTeX公式到公式数据
        if (!selectedNode.data.latex) {
            selectedNode.data.latex = cleanFormula;
            console.log('首次添加公式');
        } else {
            // 如果已经有公式，将新公式添加到现有公式列表中
            selectedNode.data.latex += ' ' + cleanFormula;
            console.log('追加公式到现有公式');
        }
        console.log('保存的完整公式:', selectedNode.data.latex);
        
        // 创建一个临时div来渲染公式
        const tempDiv = document.createElement('div');
        tempDiv.style.display = 'none';
        document.body.appendChild(tempDiv);
        
        // 使用KaTeX渲染公式到临时div
        try {
            katex.render(cleanFormula, tempDiv, {
                throwOnError: false,
                displayMode: false
            });
            console.log('公式渲染成功到临时元素');
        } catch (err) {
            console.error('公式渲染失败:', err);
            document.body.removeChild(tempDiv);
            alert('公式渲染失败: ' + err.message);
            return;
        }
        
        // 修改节点内容 - 直接通过jsMind API
        if (!jm) {
            console.error('jsMind实例未找到');
            document.body.removeChild(tempDiv);
            alert('无法更新节点：jsMind实例未找到');
            return;
        }
        
        // 记录渲染后的HTML
        const renderedFormula = tempDiv.innerHTML;
        console.log('渲染后的公式HTML:', renderedFormula.substring(0, 100) + (renderedFormula.length > 100 ? '...' : ''));
        
        // 移除临时元素
        document.body.removeChild(tempDiv);
        
        // 直接更新节点内容
        // 如果节点原始内容中已包含公式，使用更保守的方式更新
        if (selectedNode.topic.includes('katex')) {
            console.log('节点已包含公式，保守模式更新');
            
            // 创建一个额外标记，让渲染器知道这是新添加的公式
            selectedNode.data.needFormulaUpdate = true;
            selectedNode.data.latestFormula = renderedFormula;
            
            // 先更新节点使用原来的内容
            jm.update_node(selectedNode.id, selectedNode.topic);
            
            // 延迟后找到节点并更新
            setTimeout(() => {
                try {
                    // 尝试获取节点元素
                    const nodeElement = document.querySelector(`jmnode[nodeid="${selectedNode.id}"]`);
                    if (nodeElement) {
                        const topicElement = nodeElement.querySelector('.topic');
                        if (topicElement) {
                            console.log('找到节点的topic元素');
                            
                            // 向已有内容添加新公式
                            topicElement.innerHTML += ' ' + renderedFormula;
                            console.log('已将新公式添加到现有内容后');
                            
                            // 添加公式指示器
                            if (!nodeElement.querySelector('.formula-indicator')) {
                                const indicator = document.createElement('div');
                                indicator.className = 'formula-indicator';
                                indicator.title = '包含LaTeX公式';
                                nodeElement.appendChild(indicator);
                                console.log('添加了公式指示器');
                            }
                        } else {
                            console.log('未找到topic元素，直接更新整个节点');
                            // 创建一个新内容 = 原内容 + 新公式
                            const newContent = selectedNode.topic + ' ' + renderedFormula;
                            jm.update_node(selectedNode.id, newContent);
                        }
                    } else {
                        console.log('未找到节点元素，直接更新整个节点');
                        // 创建一个新内容 = 原内容 + 新公式
                        const newContent = selectedNode.topic + ' ' + renderedFormula;
                        jm.update_node(selectedNode.id, newContent);
                    }
                } catch (e) {
                    console.error('更新节点内容失败:', e);
                    // 回退到直接更新方式
                    const newContent = selectedNode.topic + ' ' + renderedFormula;
                    jm.update_node(selectedNode.id, newContent);
                }
                
                // 更新选中的节点对象以反映变化
                const updatedNode = jm.get_node(selectedNode.id);
                if (updatedNode) {
                    selectedNode = updatedNode;
                    console.log('更新了selectedNode引用');
                }
            }, 50);
        } else {
            // 简单情况：节点不包含公式，直接添加新内容
            console.log('节点不包含公式，直接更新');
            
            // 创建一个新内容 = 原内容 + 新公式
            const newContent = selectedNode.topic + ' ' + renderedFormula;
            
            // 更新节点
            jm.update_node(selectedNode.id, newContent);
            console.log('已更新节点内容');
            
            // 稍后添加公式指示器
            setTimeout(() => {
                const nodeElement = document.querySelector(`jmnode[nodeid="${selectedNode.id}"]`);
                if (nodeElement && !nodeElement.querySelector('.formula-indicator')) {
                    const indicator = document.createElement('div');
                    indicator.className = 'formula-indicator';
                    indicator.title = '包含LaTeX公式';
                    nodeElement.appendChild(indicator);
                    console.log('添加了公式指示器');
                }
                
                // 更新选中的节点对象以反映变化
                const updatedNode = jm.get_node(selectedNode.id);
                if (updatedNode) {
                    selectedNode = updatedNode;
                    console.log('更新了selectedNode引用');
                }
            }, 50);
        }
        
        console.log('-------------- 公式应用完成 --------------');
    } catch (error) {
        console.error('应用公式时出错:', error);
        console.error('错误堆栈:', error.stack);
        alert('应用公式失败: ' + error.message);
    }
}

// 显示节点公式
function showNodeFormula(node) {
    if (node && node.data && node.data.latex) {
        // 清理公式
        const formula = cleanLatexText(node.data.latex);
        
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
        try {
            if (window.katex) {
                katex.render(formula, display, {
                    throwOnError: false,
                    displayMode: true
                });
            } else {
                display.textContent = formula;
            }
        } catch (e) {
            console.error('显示公式错误:', e);
            display.textContent = '公式错误: ' + formula;
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

// 渲染所有带有LaTeX公式的节点
function renderAllFormulas() {
    console.log('重新渲染所有公式...');
    
    try {
        // 检查jm是否已初始化
        if (!jm || !jm.mind) {
            console.warn('思维导图尚未初始化，无法渲染公式');
            return;
        }
        
        // 使用正确的jsMind API获取所有节点
        const allNodes = jm.mind.nodes;
        if (!allNodes) {
            console.warn('无法获取节点列表');
            return;
        }
        
        // 遍历所有节点，渲染带有公式的节点
        Object.values(allNodes).forEach(node => {
            if (node && node.data && node.data.latex) {
                try {
                    // 清理公式
                    const formula = cleanLatexText(node.data.latex);
                    const nodeElement = document.querySelector(`jmnode[nodeid="${node.id}"]`);
                    
                    if (nodeElement) {
                        const textElement = nodeElement.querySelector('.topic');
                        if (textElement) {
                            // 保存原始文本作为标题
                            if (node.data.originalTopic) {
                                textElement.title = node.data.originalTopic;
                            } else {
                                textElement.title = node.topic;
                                node.data.originalTopic = node.topic;
                            }
                            
                            // 创建公式显示元素
                            const formulaDisplay = document.createElement('div');
                            formulaDisplay.style.display = 'inline-block';
                            
                            // 使用KaTeX渲染
                            katex.render(formula, formulaDisplay, {
                                throwOnError: false,
                                displayMode: false,
                                output: 'html'
                            });
                            
                            // 替换为渲染后的公式
                            textElement.innerHTML = formulaDisplay.innerHTML;
                            
                            // 确保公式指示器存在
                            if (!nodeElement.querySelector('.formula-indicator')) {
                                const indicator = document.createElement('div');
                                indicator.className = 'formula-indicator';
                                indicator.title = '包含LaTeX公式';
                                nodeElement.appendChild(indicator);
                            }
                        } else {
                            console.warn('未找到节点的文本元素:', node.id);
                        }
                    } else {
                        console.warn('未找到节点元素:', node.id);
                    }
                } catch (e) {
                    console.error('节点公式渲染失败:', node.id, e);
                }
            }
        });
        
        console.log('所有公式渲染完成');
    } catch (e) {
        console.error('渲染所有公式时出错:', e);
    }
}

// 初始化LaTeX编辑器
function initLatexEditor() {
    console.log('初始化LaTeX编辑器...');
    
    // 设置事件处理器
    setupLatexEditorEvents();
    
    // 添加自动渲染定时器
    setInterval(function() {
        // 只有当jm对象已初始化时才尝试渲染
        if (window.jm && jm.mind) {
            renderAllFormulas();
        }
    }, 3000);
    
    console.log('LaTeX编辑器初始化完成');
}

// 在文档加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    // 初始化将被core.js延迟调用
    console.log('LaTeX编辑器模块已加载');
});

// 导出公共函数
window.openLatexEditor = openLatexEditor;
window.setupLatexEditorEvents = setupLatexEditorEvents;
window.renderAllFormulas = renderAllFormulas;
window.initLatexEditor = initLatexEditor;
window.showNodeFormula = showNodeFormula;
window.showNodeNotePopup = showNodeNotePopup;

// 显示节点备注信息（侧边浮窗版本）
function showNodeNotePopup(node) {
    if (node && node.data && node.data.note) {
        // 创建一个临时的显示区域
        const display = document.createElement('div');
        display.className = 'note-display';
        display.style.position = 'fixed';
        display.style.top = '50%';
        display.style.right = '20px';
        display.style.transform = 'translateY(-50%)';
        display.style.backgroundColor = 'white';
        display.style.padding = '20px';
        display.style.borderRadius = '8px';
        display.style.boxShadow = '0 0 15px rgba(0,0,0,0.3)';
        display.style.zIndex = '1900';
        display.style.maxWidth = '300px';
        display.style.maxHeight = '60%';
        display.style.overflowY = 'auto';
        
        // 添加标题
        const title = document.createElement('h3');
        title.textContent = '节点备注';
        title.style.marginTop = '0';
        title.style.borderBottom = '1px solid #eee';
        title.style.paddingBottom = '10px';
        display.appendChild(title);
        
        // 添加备注内容
        const content = document.createElement('div');
        content.textContent = node.data.note;
        content.style.whiteSpace = 'pre-wrap';
        content.style.lineHeight = '1.5';
        display.appendChild(content);
        
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
        
        // 2秒后自动淡出
        setTimeout(() => {
            display.style.transition = 'opacity 0.5s';
            display.style.opacity = '0.8';
        }, 2000);
        
        // 点击其他区域关闭
        document.addEventListener('click', function closeNote(e) {
            if (!display.contains(e.target)) {
                document.body.removeChild(display);
                document.removeEventListener('click', closeNote);
            }
        });
    }
} 