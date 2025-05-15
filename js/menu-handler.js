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