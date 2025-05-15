// 思维导图图片导出相关功能

// 导出为图片功能
function exportAsImage() {
    console.log('开始导出为图片...');
    
    if (!jm || !jm.mind) {
        alert(window.i18n && typeof window.i18n.t === 'function' ? 
            window.i18n.t('mindmap_not_loaded') : '思维导图数据尚未加载');
        return;
    }
    
    try {
        // 获取思维导图容器
        const container = document.getElementById('jsmind_container');
        if (!container) {
            throw new Error('找不到思维导图容器');
        }
        
        // 显示加载指示器
        const loadingIndicator = document.getElementById('loading');
        if (loadingIndicator) {
            loadingIndicator.style.display = 'block';
            loadingIndicator.textContent = window.i18n && typeof window.i18n.t === 'function' ? 
                window.i18n.t('generating_image') : '正在生成图片...';
        }
        
        // 使用html2canvas捕获思维导图
        if (typeof html2canvas !== 'function') {
            // 动态加载html2canvas
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js';
            script.onload = captureImage;
            script.onerror = () => {
                if (loadingIndicator) {
                    loadingIndicator.style.display = 'none';
                }
                alert('无法加载html2canvas库，请检查网络连接');
            };
            document.head.appendChild(script);
            return;
        } else {
            captureImage();
        }
        
        // 捕获图片的函数
        function captureImage() {
            try {
                // 记录原始滚动位置和缩放比例
                const originalScrollLeft = container.scrollLeft;
                const originalScrollTop = container.scrollTop;
                
                // 临时隐藏工具栏和不需要的UI元素
                const toolbar = document.getElementById('toolbar');
                const zoomController = document.getElementById('zoom_controller');
                let toolbarDisplay = 'block';
                let zoomDisplay = 'flex';
                
                if (toolbar) {
                    toolbarDisplay = toolbar.style.display;
                    toolbar.style.display = 'none';
                }
                
                if (zoomController) {
                    zoomDisplay = zoomController.style.display;
                    zoomController.style.display = 'none';
                }
                
                // 临时隐藏所有提示窗和弹出元素
                const tooltips = document.querySelectorAll('.note-tooltip, .context-menu, .dropdown-content');
                const tooltipDisplays = [];
                tooltips.forEach(tooltip => {
                    tooltipDisplays.push(tooltip.style.display);
                    tooltip.style.display = 'none';
                });
                
                // 获取思维导图的主画布元素
                const mainView = container.querySelector('.jsmind-inner');
                if (!mainView) {
                    throw new Error('找不到思维导图画布元素');
                }
                
                // 确保在导出前展开所有节点
                if (jm && jm.view && typeof jm.expand_all === 'function') {
                    jm.expand_all();
                }
                
                // 延迟100ms确保所有节点完全渲染
                setTimeout(() => {
                    try {
                        // 计算思维导图内容的实际边界
                        let minX = Infinity, minY = Infinity, maxX = 0, maxY = 0;
                        
                        // 尝试获取jsMind内部的画布尺寸（如果可用）
                        let canvasWidth, canvasHeight;
                        let useJsMindSize = false;
                        
                        if (jm && jm.view && jm.view.size) {
                            try {
                                // 如果jsMind提供了size API，直接使用它的尺寸
                                const jmSize = jm.view.size;
                                
                                if (jmSize.width > 50 && jmSize.height > 50) {
                                    canvasWidth = jmSize.width;
                                    canvasHeight = jmSize.height;
                                    useJsMindSize = true;
                                }
                            } catch (e) {
                                console.warn('无法获取jsMind尺寸:', e);
                            }
                        }
                        
                        if (!useJsMindSize) {
                            // 先获取容器和内部视图的尺寸作为参考
                            const containerRect = container.getBoundingClientRect();
                            const mainViewRect = mainView.getBoundingClientRect();
                            
                            // 获取所有节点和连接线，更详细地分析边界
                            const nodes = mainView.querySelectorAll('jmnode');
                            const expanders = mainView.querySelectorAll('jmexpander');
                            const paths = mainView.querySelectorAll('path');
                            
                            // 检查是否有足够的元素
                            if (nodes.length === 0) {
                                throw new Error('找不到思维导图节点元素');
                            }
                            
                            // 更精确地计算节点边界
                            nodes.forEach(node => {
                                const rect = node.getBoundingClientRect();
                                minX = Math.min(minX, rect.left);
                                minY = Math.min(minY, rect.top);
                                maxX = Math.max(maxX, rect.right);
                                maxY = Math.max(maxY, rect.bottom);
                            });
                            
                            // 考虑展开器的边界
                            expanders.forEach(expander => {
                                const rect = expander.getBoundingClientRect();
                                minX = Math.min(minX, rect.left);
                                minY = Math.min(minY, rect.top);
                                maxX = Math.max(maxX, rect.right);
                                maxY = Math.max(maxY, rect.bottom);
                            });
                            
                            // 处理SVG连接线的边界
                            paths.forEach(path => {
                                try {
                                    if (path.getBBox) {
                                        const box = path.getBBox();
                                        const svgRect = path.ownerSVGElement.getBoundingClientRect();
                                        
                                        const pathLeft = svgRect.left + box.x;
                                        const pathTop = svgRect.top + box.y;
                                        const pathRight = pathLeft + box.width;
                                        const pathBottom = pathTop + box.height;
                                        
                                        minX = Math.min(minX, pathLeft);
                                        minY = Math.min(minY, pathTop);
                                        maxX = Math.max(maxX, pathRight);
                                        maxY = Math.max(maxY, pathBottom);
                                    } else {
                                        const rect = path.getBoundingClientRect();
                                        minX = Math.min(minX, rect.left);
                                        minY = Math.min(minY, rect.top);
                                        maxX = Math.max(maxX, rect.right);
                                        maxY = Math.max(maxY, rect.bottom);
                                    }
                                } catch (e) {
                                    console.warn('计算路径边界时出错:', e);
                                }
                            });
                            
                            // 遍历所有内部元素
                            const allInnerElements = mainView.querySelectorAll('*');
                            allInnerElements.forEach(element => {
                                try {
                                    const rect = element.getBoundingClientRect();
                                    // 只考虑可见且有实际尺寸的元素
                                    if (rect.width > 0 && rect.height > 0) {
                                        minX = Math.min(minX, rect.left);
                                        minY = Math.min(minY, rect.top);
                                        maxX = Math.max(maxX, rect.right);
                                        maxY = Math.max(maxY, rect.bottom);
                                    }
                                } catch (e) {
                                    // 忽略边界计算错误
                                }
                            });
                            
                            // 检查是否成功找到边界并记录
                            if (minX === Infinity || minY === Infinity || maxX === 0 || maxY === 0) {
                                // 使用内部视图的边界作为备用
                                minX = mainViewRect.left;
                                minY = mainViewRect.top;
                                maxX = mainViewRect.right;
                                maxY = mainViewRect.bottom;
                            }
                            
                            // 添加大边距确保内容不被裁剪
                            const padding = 150; // 增加边距确保内容不被裁剪
                            
                            // 计算画布大小并添加额外的安全缩放
                            const contentWidth = maxX - minX;
                            const contentHeight = maxY - minY;
                            
                            // 使用更大的尺寸以确保包含所有内容
                            canvasWidth = contentWidth + (padding * 2);
                            canvasHeight = contentHeight + (padding * 2);
                            
                            // 如果内容尺寸明显小于容器，尝试使用更大的值
                            if (contentWidth < mainViewRect.width * 0.8 || contentHeight < mainViewRect.height * 0.8) {
                                canvasWidth = Math.max(canvasWidth, mainViewRect.width + padding);
                                canvasHeight = Math.max(canvasHeight, mainViewRect.height + padding);
                            }
                            
                            // 添加额外的安全因子
                            const safetyFactor = 1.2; // 增加20%的额外空间
                            canvasWidth = Math.ceil(canvasWidth * safetyFactor);
                            canvasHeight = Math.ceil(canvasHeight * safetyFactor);
                        }
                        
                        // 使用html2canvas捕获思维导图
                        html2canvas(container, {
                            backgroundColor: '#FFFFFF',
                            scale: 2, // 提高图片质量
                            useCORS: true, // 允许跨域图片
                            allowTaint: true, // 允许包含跨域元素
                            logging: false, // 禁用日志以提高性能
                            imageTimeout: 0, // 禁用图像超时
                            removeContainer: false, // 不移除临时容器以避免问题
                            ignoreElements: (element) => {
                                // 忽略所有提示窗和不需要的UI元素
                                return element.classList && (
                                    element.classList.contains('note-tooltip') ||
                                    element.classList.contains('context-menu') ||
                                    element.classList.contains('dropdown-content') ||
                                    element.id === 'toolbar' ||
                                    element.id === 'zoom_controller' ||
                                    element.id === 'loading'
                                );
                            },
                            onclone: (documentClone, element) => {
                                // 克隆文档后，对克隆进行额外处理
                                try {
                                    // 找到克隆文档中的主容器
                                    const clonedContainer = documentClone.getElementById('jsmind_container');
                                    if (clonedContainer) {
                                        // 确保克隆容器可以显示完整内容
                                        clonedContainer.style.width = canvasWidth + 'px';
                                        clonedContainer.style.height = canvasHeight + 'px';
                                        clonedContainer.style.overflow = 'visible';
                                        
                                        // 移除可能限制大小的样式
                                        clonedContainer.style.maxWidth = 'none';
                                        clonedContainer.style.maxHeight = 'none';
                                        
                                        // 查找内部视图并设置样式
                                        const clonedInnerView = clonedContainer.querySelector('.jsmind-inner');
                                        if (clonedInnerView) {
                                            clonedInnerView.style.width = canvasWidth + 'px';
                                            clonedInnerView.style.height = canvasHeight + 'px';
                                            clonedInnerView.style.overflow = 'visible';
                                        }
                                    }
                                } catch (e) {
                                    console.warn('处理克隆文档时出错:', e);
                                }
                                return documentClone;
                            },
                            // 使用宽松的尺寸设置，让html2canvas自动处理 
                            width: canvasWidth,
                            height: canvasHeight
                        }).then(function(canvas) {
                            // 恢复UI元素显示状态
                            if (toolbar) {
                                toolbar.style.display = toolbarDisplay;
                            }
                            if (zoomController) {
                                zoomController.style.display = zoomDisplay;
                            }
                            
                            // 恢复提示窗显示状态
                            tooltips.forEach((tooltip, index) => {
                                tooltip.style.display = tooltipDisplays[index];
                            });
                            
                            // 恢复原始滚动位置
                            container.scrollLeft = originalScrollLeft;
                            container.scrollTop = originalScrollTop;
                            
                            // 转换为图片并下载
                            try {
                                const imgData = canvas.toDataURL('image/png');
                                const link = document.createElement('a');
                                
                                // 设置文件名
                                const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
                                const fileName = 'mindmap-' + timestamp + '.png';
                                
                                link.download = fileName;
                                link.href = imgData;
                                link.click();
                                
                                console.log('成功导出为图片');
                            } catch (err) {
                                console.error('导出图片时出错:', err);
                                alert(window.i18n && typeof window.i18n.t === 'function' ? 
                                    window.i18n.t('image_export_error', err.message) : 
                                    '导出图片失败: ' + err.message);
                            }
                            
                            // 隐藏加载指示器
                            if (loadingIndicator) {
                                loadingIndicator.style.display = 'none';
                            }
                        }).catch(function(error) {
                            console.error('生成图片时出错:', error);
                            
                            // 恢复UI元素显示状态
                            if (toolbar) {
                                toolbar.style.display = toolbarDisplay;
                            }
                            if (zoomController) {
                                zoomController.style.display = zoomDisplay;
                            }
                            
                            // 恢复提示窗显示状态
                            tooltips.forEach((tooltip, index) => {
                                tooltip.style.display = tooltipDisplays[index];
                            });
                            
                            // 隐藏加载指示器
                            if (loadingIndicator) {
                                loadingIndicator.style.display = 'none';
                            }
                            
                            alert(window.i18n && typeof window.i18n.t === 'function' ? 
                                window.i18n.t('image_export_error', error.message) : 
                                '导出图片失败: ' + error.message);
                        });
                    } catch (delayedError) {
                        console.error('延迟处理过程中出错:', delayedError);
                        
                        // 恢复UI元素显示状态
                        if (toolbar) {
                            toolbar.style.display = toolbarDisplay;
                        }
                        if (zoomController) {
                            zoomController.style.display = zoomDisplay;
                        }
                        
                        // 恢复提示窗显示状态
                        tooltips.forEach((tooltip, index) => {
                            tooltip.style.display = tooltipDisplays[index];
                        });
                        
                        // 隐藏加载指示器
                        if (loadingIndicator) {
                            loadingIndicator.style.display = 'none';
                        }
                        
                        alert(window.i18n && typeof window.i18n.t === 'function' ? 
                            window.i18n.t('image_export_error', delayedError.message) : 
                            '导出图片失败: ' + delayedError.message);
                    }
                }, 100); // 延迟100ms确保所有节点都完全渲染
                
            } catch (e) {
                // 隐藏加载指示器
                if (loadingIndicator) {
                    loadingIndicator.style.display = 'none';
                }
                
                console.error('捕获图片时出错:', e);
                alert(window.i18n && typeof window.i18n.t === 'function' ? 
                    window.i18n.t('image_export_error', e.message) : 
                    '导出图片失败: ' + e.message);
            }
        }
    } catch (e) {
        // 隐藏加载指示器
        if (loadingIndicator) {
            loadingIndicator.style.display = 'none';
        }
        
        console.error('导出图片失败:', e);
        alert(window.i18n && typeof window.i18n.t === 'function' ? 
            window.i18n.t('image_export_error', e.message) : 
            '导出图片失败: ' + e.message);
    }
}

// 导出成员到全局
window.exportAsImage = exportAsImage; 