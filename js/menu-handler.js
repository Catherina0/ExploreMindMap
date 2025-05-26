// 思维导图下拉菜单和菜单相关功能

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
}

// 导出成员到全局
window.setupDropdownMenus = setupDropdownMenus;

// 检查全局变量apiStats是否存在，如果不存在则创建
if (!window.apiStats) {
    window.apiStats = [];
}

// 收集API请求时间的函数
function collectApiStats(endpoint, startTime, endTime, options) {
    window.apiStats.push({
        endpoint: endpoint,
        duration: endTime - startTime,
        timestamp: new Date().toISOString(),
        requestOptions: options ? {
            model: options.model,
            hasMessages: !!options.messages,
            messagesCount: options.messages ? options.messages.length : 0,
            temperature: options.temperature,
            max_tokens: options.max_tokens
        } : null
    });
    
    // 限制收集的统计数量，避免占用过多内存
    if (window.apiStats.length > 100) {
        window.apiStats = window.apiStats.slice(-100);
    }
}

// 添加钩子来拦截OpenAI API调用
const originalCreateCompletion = window.openaiApi.createCompletion;
window.openaiApi.createCompletion = async function(options) {
    const startTime = performance.now();
    try {
        const result = await originalCreateCompletion.apply(this, arguments);
        const endTime = performance.now();
        collectApiStats(options.endpoint, startTime, endTime, options);
        return result;
    } catch (error) {
        const endTime = performance.now();
        collectApiStats(options.endpoint, startTime, endTime, options);
        throw error;
    }
};

// 处理问题反馈按钮点击事件
document.getElementById('export_feedback').addEventListener('click', function() {
    if (typeof window.exportFeedbackLog === 'function') {
        // 检查是否已有错误日志，如果没有，尝试获取当前错误状态
        try {
            if ((!window.consoleErrors || window.consoleErrors.length === 0) && 
                (!window.uncaughtErrors || window.uncaughtErrors.length === 0)) {
                // 记录当前页面状态信息作为日志
                console.error('问题反馈：用户手动触发导出 - 当前页面状态', {
                    timestamp: new Date().toISOString(),
                    selectedNode: selectedNode ? selectedNode.id : 'none',
                    jsmindInitialized: !!jm,
                    aiAssistantEnabled: aiAssistantEnabled,
                    domReady: document.readyState
                });
            }
        } catch (e) {
            // 忽略获取状态时的错误
        }
        
        // 导出日志
        window.exportFeedbackLog();
    } else {
        alert('导出功能不可用，请刷新页面后重试');
    }
}); 