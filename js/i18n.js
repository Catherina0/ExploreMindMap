// 思维导图应用的国际化支持
// 支持中文和英文切换

// 当前语言
let currentLang = 'zh'; // 默认为中文

// 翻译对象
const translations = {
    zh: {
        // 通用UI元素
        'app_title': 'AI 思维导图助手',
        'loading': '处理中...',
        
        // 头部和按钮
        'ai_assistant': 'AI 助手',
        'show_assistant': '显示助手',
        
        // 工具栏
        'new_mindmap': '新建思维导图',
        'save_mindmap': '保存思维导图',
        'load_mindmap': '加载思维导图',
        'save_as_image': '保存为图片',
        'add_node': '添加子节点',
        'add_sibling': '添加同级节点',
        'delete_node': '删除节点',
        'edit_node': '编辑节点',
        'add_note': '添加笔记',
        'generate_summary': '生成总结',
        'ai_modify': 'AI修改',
        'root_node': '根节点',
        'new_node': '新节点',
        'zoom_out': '缩小',
        'zoom_in': '放大',
        'reset_view': '重置视图',
        'center_view': '居中视图',
        'expand_all': '展开全部',
        'collapse_all': '折叠全部',
        
        // 保存/加载下拉菜单
        'save_to_file': '保存到文件',
        'save_to_browser': '保存到浏览器',
        'load_from_file': '从文件加载',
        'load_from_browser': '从浏览器加载',
        'load_example': '加载示例',
        'save_as_json': '保存为JSON',
        'export_as_markdown': '导出为Markdown',
        'load_json_file': '加载JSON文件',
        'import_markdown': '导入Markdown',
        
        // 主题
        'select_theme': '选择主题',
        'blue_theme': '蓝色主题',
        'yellow_theme': '黄色主题',
        'red_theme': '红色主题',
        'green_theme': '绿色主题',
        
        // 编辑器相关
        'formula': '公式',
        'note': '备注',
        'relation_line': '关联线',
        'summary': '摘要',
        'node_note': '节点备注',
        'node_summary': '节点摘要',
        'enter_latex': '请输入LaTeX语法',
        'enter_note': '输入节点备注...',
        'enter_summary': '输入简短摘要...',
        'view_note': '查看备注',
        'apply': '应用',
        'cancel': '取消',
        'complete': '完成',
        'common_formulas': '常用公式',
        
        // 聊天相关
        'chat_header': 'AI思维导图助手',
        'chat_welcome': '您好！我是思维导图AI助手。选择一个节点并向我提问，我将帮助您扩展思维导图。',
        'chat_placeholder': '输入您的问题...',
        'new_conversation': '新对话',
        'ai_toggle': 'AI助手',
        'modify_map': '修改导图',
        'settings': '设置',
        'ai_service': 'AI服务:',
        'api_key': 'API密钥:',
        'api_key_placeholder': '输入API密钥',
        'resource_name': '资源名称:',
        'resource_name_placeholder': 'Azure资源名称',
        'deployment_name': '部署名称:',
        'deployment_name_placeholder': '如：gpt-4',
        
        // 提示和消息
        'select_node_first': '请先选择一个节点',
        'formula_editor_not_ready': '公式编辑器未就绪',
        'relation_start_select': '已选择起始节点: "{0}"\n现在请选择目标节点',
        'summary_editor_not_found': '摘要编辑器未找到',
        'summary_input_not_found': '摘要输入框未找到',
        'note_editor_not_found': '备注编辑器未找到',
        'note_input_not_found': '备注输入框未找到',
        'save_success': '成功保存为{0}格式',
        'load_success': '已加载{0}格式思维导图',
        'mindmap_not_loaded': '思维导图数据尚未加载',
        'export_success': '成功导出为{0}格式',
        'import_success': '从{0}导入成功',
        'no_valid_parent': '无法获取父节点对象: {0}',
        'root_switch_confirm': '找不到当前选中的节点。是否要在根节点下添加新节点？',
        'delete_confirm': '确定要删除此节点及其所有子节点吗？',
        'cant_delete_root': '不能删除根节点',
        
        // 错误信息
        'note_add_error': '添加备注失败, 请重试',
        'node_edit_error': '编辑节点失败: {0}',
        'node_delete_error': '删除节点失败: {0}',
        'node_add_error': '添加节点失败: {0}',
        'invalid_node_id': '选中节点没有有效ID',
        'api_settings_prompt': '请先点击设置，输入API密钥。',
        'enable_ai_first': '请先开启AI助手，才能使用思维导图修改功能。',
        'select_node_for_modify': '请先选择一个节点，然后再请求修改思维导图。',
        'node_not_found': '无法在jsMind中找到节点: {0}',
        
        // 语言切换
        'language': '语言',
        'language_zh': '中文',
        'language_en': '英文',
        
        // 新增翻译字符串
        'new_mindmap_confirm': '确定要创建新的思维导图吗？当前未保存的内容将丢失。',
        'new_mindmap_created': '新思维导图已创建',
        'new_mindmap_error': '创建失败: {0}',
        'generating_image': '正在生成图片...',
        'image_export_error': '导出图片失败: {0}'
    },
    en: {
        // Common UI elements
        'app_title': 'AI Mind Map Assistant',
        'loading': 'Processing...',
        
        // Header and buttons
        'ai_assistant': 'AI Assistant',
        'show_assistant': 'Show Assistant',
        
        // Toolbar
        'new_mindmap': 'New Mind Map',
        'save_mindmap': 'Save Mind Map',
        'load_mindmap': 'Load Mind Map',
        'save_as_image': 'Save as Image',
        'add_node': 'Add Child Node',
        'add_sibling': 'Add Sibling Node',
        'delete_node': 'Delete Node',
        'edit_node': 'Edit Node',
        'add_note': 'Add Note',
        'generate_summary': 'Generate Summary',
        'ai_modify': 'AI Modify',
        'root_node': 'Root Node',
        'new_node': 'New Node',
        'zoom_out': 'Zoom Out',
        'zoom_in': 'Zoom In',
        'reset_view': 'Reset View',
        'center_view': 'Center View',
        'expand_all': 'Expand All',
        'collapse_all': 'Collapse All',
        
        // Save/Load dropdown menu
        'save_to_file': 'Save to File',
        'save_to_browser': 'Save to Browser',
        'load_from_file': 'Load from File',
        'load_from_browser': 'Load from Browser',
        'load_example': 'Load Example',
        'save_as_json': 'Save as JSON',
        'export_as_markdown': 'Export as Markdown',
        'load_json_file': 'Load JSON File',
        'import_markdown': 'Import Markdown',
        
        // Themes
        'select_theme': 'Select Theme',
        'blue_theme': 'Blue Theme',
        'yellow_theme': 'Yellow Theme',
        'red_theme': 'Red Theme',
        'green_theme': 'Green Theme',
        
        // Editor related
        'formula': 'Formula',
        'note': 'Note',
        'relation_line': 'Relation Line',
        'summary': 'Summary',
        'node_note': 'Node Note',
        'node_summary': 'Node Summary',
        'enter_latex': 'Please enter LaTeX syntax',
        'enter_note': 'Enter node note...',
        'enter_summary': 'Enter brief summary...',
        'view_note': 'View Note',
        'apply': 'Apply',
        'cancel': 'Cancel',
        'complete': 'Complete',
        'common_formulas': 'Common Formulas',
        
        // Chat related
        'chat_header': 'AI Mind Map Assistant',
        'chat_welcome': 'Hello! I am the Mind Map AI Assistant. Select a node and ask me questions, I will help you expand your mind map.',
        'chat_placeholder': 'Enter your question...',
        'new_conversation': 'New Conversation',
        'ai_toggle': 'AI Assistant',
        'modify_map': 'Modify Map',
        'settings': 'Settings',
        'ai_service': 'AI Service:',
        'api_key': 'API Key:',
        'api_key_placeholder': 'Enter API key',
        'resource_name': 'Resource Name:',
        'resource_name_placeholder': 'Azure resource name',
        'deployment_name': 'Deployment Name:',
        'deployment_name_placeholder': 'e.g.: gpt-4',
        
        // Prompts and messages
        'select_node_first': 'Please select a node first',
        'formula_editor_not_ready': 'Formula editor is not ready',
        'relation_start_select': 'Start node selected: "{0}"\nNow please select a target node',
        'summary_editor_not_found': 'Summary editor not found',
        'summary_input_not_found': 'Summary input not found',
        'note_editor_not_found': 'Note editor not found',
        'note_input_not_found': 'Note input not found',
        'save_success': 'Successfully saved in {0} format',
        'load_success': 'Loaded mind map in {0} format',
        'mindmap_not_loaded': 'Mind map data not loaded yet',
        'export_success': 'Successfully exported to {0} format',
        'import_success': 'Successfully imported from {0}',
        'no_valid_parent': 'Unable to get parent node object: {0}',
        'root_switch_confirm': 'Cannot find the currently selected node. Do you want to add a new node under the root node?',
        'delete_confirm': 'Are you sure you want to delete this node and all its child nodes?',
        'cant_delete_root': 'Cannot delete the root node',
        
        // Error messages
        'note_add_error': 'Failed to add note, please try again',
        'node_edit_error': 'Failed to edit node: {0}',
        'node_delete_error': 'Failed to delete node: {0}',
        'node_add_error': 'Failed to add node: {0}',
        'invalid_node_id': 'Selected node does not have a valid ID',
        'api_settings_prompt': 'Please click settings and enter your API key first.',
        'enable_ai_first': 'Please enable the AI assistant first to use the mind map modification function.',
        'select_node_for_modify': 'Please select a node first, then request to modify the mind map.',
        'node_not_found': 'Node not found in jsMind: {0}',
        
        // Language switching
        'language': 'Language',
        'language_zh': 'Chinese',
        'language_en': 'English',
        
        // 新增翻译字符串
        'new_mindmap_confirm': 'Are you sure you want to create a new mind map? Unsaved changes will be lost.',
        'new_mindmap_created': 'New mind map created',
        'new_mindmap_error': 'Creation failed: {0}',
        'generating_image': 'Generating image...',
        'image_export_error': 'Failed to export image: {0}'
    }
};

// 格式化字符串函数
function format(str, ...args) {
    return str.replace(/{(\d+)}/g, function(match, number) {
        return typeof args[number] !== 'undefined' ? args[number] : match;
    });
}

// 获取翻译文本的函数
function t(key, ...args) {
    // 如果key不存在于当前语言，尝试在另一种语言中查找，或返回key本身
    const translation = translations[currentLang][key] || 
                        translations[currentLang === 'zh' ? 'en' : 'zh'][key] || 
                        key;
    
    if (args.length === 0) {
        return translation;
    }
    
    return format(translation, ...args);
}

// 切换语言
function switchLanguage(lang) {
    if (lang !== 'zh' && lang !== 'en') {
        console.error('不支持的语言:', lang);
        return false;
    }
    
    if (currentLang === lang) {
        return true; // 已经是请求的语言
    }
    
    console.log(`切换语言从 ${currentLang} 到 ${lang}`);
    currentLang = lang;
    
    // 更新html元素的lang属性
    document.documentElement.lang = lang;
    
    // 保存语言设置到localStorage
    try {
        localStorage.setItem('preferred_language', lang);
        console.log('语言偏好已保存到localStorage');
    } catch (e) {
        console.warn('无法保存语言偏好到localStorage:', e);
    }
    
    // 更新页面上所有带有data-i18n属性的元素
    updateAllTexts();
    
    // 确保语言按钮显示正确
    updateLanguageButton();
    
    // 重建工具栏，确保图标和文本都正确显示
    if (typeof window.initToolbar === 'function') {
        console.log('语言切换后重建工具栏');
        window.initToolbar();
    }
    
    // 触发自定义事件，以便其他脚本可以响应语言变化
    const event = new CustomEvent('languageChanged', { detail: { language: lang } });
    document.dispatchEvent(event);
    
    return true;
}

// 更新页面上所有带有data-i18n属性的元素的文本
function updateAllTexts() {
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        if (key) {
            if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                if (element.getAttribute('placeholder')) {
                    element.setAttribute('placeholder', t(key));
                } else {
                    element.value = t(key);
                }
            } else {
                element.textContent = t(key);
            }
        }
    });
    
    // 更新带有data-i18n-tooltip属性的元素的tooltip
    document.querySelectorAll('[data-i18n-tooltip]').forEach(element => {
        const key = element.getAttribute('data-i18n-tooltip');
        if (key) {
            element.setAttribute('data-tooltip', t(key));
        }
    });
    
    // 更新带有data-i18n-title属性的元素的title
    document.querySelectorAll('[data-i18n-title]').forEach(element => {
        const key = element.getAttribute('data-i18n-title');
        if (key) {
            element.setAttribute('title', t(key));
        }
    });
    
    // 更新动态创建的工具栏按钮
    document.querySelectorAll('[data-i18n-text]').forEach(element => {
        const key = element.getAttribute('data-i18n-text');
        if (key) {
            // 检查元素中是否有.btn-text子元素
            const textSpan = element.querySelector('.btn-text');
            if (textSpan) {
                // 如果有.btn-text子元素，只更新该元素的文本，保留图标
                textSpan.textContent = t(key);
            } else {
                // 没有找到.btn-text子元素，直接更新整个元素的文本
                element.textContent = t(key);
            }
        }
    });
    
    // 更新动态创建的工具栏按钮的title属性
    document.querySelectorAll('[data-i18n-title]').forEach(element => {
        const key = element.getAttribute('data-i18n-title');
        if (key) {
            element.setAttribute('title', t(key));
        }
    });
    
    // 更新页面标题
    document.title = t('app_title');
}

// 初始化国际化功能
function initI18n() {
    // 获取用户之前设置的语言偏好（如果有）
    try {
        const savedLang = localStorage.getItem('preferred_language');
        if (savedLang && (savedLang === 'zh' || savedLang === 'en')) {
            currentLang = savedLang;
            console.log(`使用保存的语言偏好: ${currentLang}`);
        } else {
            // 如果没有保存的语言偏好，尝试使用浏览器语言
            const browserLang = navigator.language || navigator.userLanguage;
            if (browserLang && browserLang.startsWith('zh')) {
                currentLang = 'zh';
            } else {
                currentLang = 'en';
            }
            console.log(`根据浏览器设置语言为: ${currentLang}`);
        }
        
        // 设置html元素的lang属性
        document.documentElement.lang = currentLang;
        
    } catch (e) {
        console.warn('无法获取语言偏好:', e);
    }
    
    // 绑定语言切换器事件
    document.addEventListener('DOMContentLoaded', () => {
        // 初始化更新所有文本
        updateAllTexts();
        
        // 更新语言显示文本
        updateLanguageButton();
        
        // 确保工具栏正确初始化（包含图标）
        if (typeof window.initToolbar === 'function') {
            console.log('I18n初始化后显式调用工具栏初始化');
            window.initToolbar();
        }
        
        // 找到语言切换按钮并绑定事件
        const langToggle = document.getElementById('language_toggle');
        if (langToggle) {
            console.log('找到语言切换按钮，绑定事件');
            langToggle.addEventListener('click', function() {
                // 切换语言：如果当前是中文则切换到英文，反之亦然
                const newLang = currentLang === 'zh' ? 'en' : 'zh';
                switchLanguage(newLang);
                // 更新按钮文本
                updateLanguageButton();
            });
        } else {
            console.warn('找不到语言切换按钮(#language_toggle)');
        }
    });
}

// 更新语言切换按钮显示
function updateLanguageButton() {
    const langDisplay = document.getElementById('current_lang');
    if (langDisplay) {
        // 始终显示"中文/English"，让用户知道可以在这两种语言间切换
        langDisplay.textContent = "中文/English";
    }
}

// 暴露的i18n API
window.i18n = {
    t,
    switchLanguage,
    updateAllTexts,
    getCurrentLang: () => currentLang
};

// 自动初始化
initI18n(); 