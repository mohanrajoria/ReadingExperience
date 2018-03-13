screenOverlayHandler({action : 'show', type : 'page-loading'});

var __BASE_URL__ = "http://gateway.staging.juggernaut.in/",
    __USER_ID__ = "",
    __BOOK_ID__ = "",
    __AUTH_TOKEN__ = "Bearer RLYTUIII12ADBF",
    __CLIENT_NAME__ = "",
    __BOOK_TYPE__ = "commissioned";


var _all_images_data_ = {},
    _all_footnotes_data_ = {},
    _loaded_segment_ids_ = [],
    _loaded_page_numbers_ = [],
    _fetching_segment_ids_ = [],
    _fetching_page_numbers_ = [],
    _max_page_number_ = 1,
    _footnote_popup_selector_ = '#tooltip-container',
    _chapter_parent_container_selector_commissioned_ = '#commissioned.chapter-parent-container',
    _chapter_parent_container_selector_community_ = '#community.chapter-parent-container',
    _visible_viewport_element_obj_ = {
        visibleFirstElement : {
            pageNumber : '',
            cId : '',
            topOffset : ''
        },
        scrollPosition : ''
    },
    sectionsCalled = {},
    scrollDirection,
    test = false,
    scrollPositionHandler,
    allSegmentsID = [],
    _scrollPositionUpdateCronTimeout_ = 500,
    _saveLastReadLocationTimeout_ = 1000,
    _styling_classes_obj_ = {
        'backgroundColorStyle' : {
            classes : [
                'black', 'white', 'grey', 'biege'
            ],
            prefix : '',
            suffix : '-BG-theme',
            activeClass : '',
            default : 'white',
            nextBackgroundColor : function(bgColorMidText) {
                if(!bgColorMidText) return '';
                if(this.classes.indexOf(bgColorMidText) === -1 && bgColorMidText != 'default') return '';

                this.activeClass = (bgColorMidText === 'default') ? this.default : bgColorMidText;
                return this.prefix + this.activeClass + this.suffix;
            },
            currentActiveClass : function() {
                return this.activeClass ? this.prefix + this.activeClass + this.suffix : '';
            },
            getDefaultValue : function() {
                return this.default
            }
        },
        'fontSizeStyle' : {
            classes : [
                'xsmall', 'small', 'medium', 'large', 'xlarge'
            ],
            prefix : 'font-size-',
            suffix : '',
            activeClass : '',
            default : 'medium',
            validModificationTypes : ['inc', 'dec'],
            nextFontSize : function(modificationType) {
                if(!modificationType) return '';
                if(this.validModificationTypes.indexOf(modificationType) === -1 && modificationType != 'default') return '';

                var nextClassMidStr = '',
                    classesLen = this.classes.length;

                if(modificationType === 'default') {
                    nextClassMidStr = this.default;
                } else {
                    for(var i = 0; i < classesLen; i++) {
                        var a = this.classes[i];
                        if(a === this.activeClass) {
                            if(modificationType == 'inc') {
                                nextClassMidStr = (this.classes[i + 1] ? this.classes[i + 1] : this.activeClass);
                                break;
                            } else if(modificationType == 'dec') {
                                nextClassMidStr = (this.classes[i - 1] ? this.classes[i - 1] : this.activeClass);
                                break;
                            }
                        }
                    }
                }

                this.activeClass = nextClassMidStr;
                return this.prefix + this.activeClass + this.suffix;
            },
            currentActiveClass : function() {
                return this.activeClass ? this.prefix + this.activeClass + this.suffix : '';
            },
            getDefaultValue : function() {
                return this.default
            }
        },
        'lineHeightStyle' : {
            classes : [
                'small', 'medium', 'large'
            ],
            prefix : 'line-height-',
            suffix : '',
            activeClass : '',
            default : 'medium',
            nextLineHeight : function(lineHeightMidText) {
                if(!lineHeightMidText) return '';
                if(this.classes.indexOf(lineHeightMidText) === -1 && lineHeightMidText != 'default') return '';

                this.activeClass = (lineHeightMidText === 'default') ? this.default : lineHeightMidText;
                return this.prefix + this.activeClass + this.suffix;
            },
            currentActiveClass : function() {
                return this.activeClass ? this.prefix + this.activeClass + this.suffix : '';
            },
            getDefaultValue : function() {
                return this.default
            }
        }
    };

$(document).ready(function() {
    /** Validate user function : get userId and bookId from url,
    if exist and verified via ajax call to server
    Callback will be triggered **/
    validateUserForBook(function() {
        toggleFootnotePopup('hide');
        getSavedUserPreferences();

        if(__VIEW_TYPE__ === 'preview') {
            $('.chapter-parent-container#commissioned').show();
            getPreviewChaptersCommissioned(formatPreviewDetailsCommissioned);
            bindChapterContainerScrollEnd(scrollEndCallBack);
            // bindChapterContainerOnScroll(scrollingCallBack);
            checkScrollPositionChangesAndUpdate(scrollingCallBack);
        } else {
            $('.chapter-parent-container#commissioned').show();
            getChaptersCommissioned(formatReadDetailsCommissioned);
            bindChapterContainerScrollEnd(scrollEndCallBack);
            // bindChapterContainerOnScroll(scrollingCallBack);
            checkScrollPositionChangesAndUpdate(scrollingCallBack);
            // checkPageNumberUpdateAndSaveLastReadLocation();
        }
    })

    /** Font size change event **/
    $(document).on('click', '.font-size-update', function(e) {
        var fontSizeAttr = 'data-font-size';
        var fontSize = e.target.getAttribute(fontSizeAttr);
        if(fontSize){
            saveCurrentScrollAndFirstElement(_visible_viewport_element_obj_);
            modifyFontSize(fontSize);
            maintainVisibleViewportContentsPosition(_visible_viewport_element_obj_);
        }
    })

    /** Line height change event **/
    $(document).on('click', '.line-height-update', function(e) {
        var lineHeightAttr = 'data-line-height';
        var lineHeight = e.target.getAttribute(lineHeightAttr);
        if(lineHeight) {
            saveCurrentScrollAndFirstElement(_visible_viewport_element_obj_);
            modifyLineHeight(lineHeight);
            maintainVisibleViewportContentsPosition(_visible_viewport_element_obj_);
        }
    })

    /** Background color change event **/
    $(document).on('click', '.background-color-update', function(e) {
        var backgroundColorAttr = 'data-background-color';
        var backgroundColor = e.target.getAttribute(backgroundColorAttr);
        if(backgroundColor) {
            modifyBackgroundColor(backgroundColor);
        }
    })

    /** Chapter parent container click event : callback to handle hide show popups etc. **/
    $(document).on('click', _chapter_parent_container_selector_commissioned_, chapterParentContainerClickCallback);

    /** Trigger footnote popup event **/
    $(document).on('click', 'fnote.footnote-activator', footnoteTriggerCallback)

    /** Show reading options event **/
    $(document).on('click', '#option-trigger-btn', toggleReadingOptions)

    /** Show Table of content event **/
    $(document).on('click', '.toc-option', showTableOfContent)

    /** show text formatting options event **/
    $(document).on('click', '.text-format-option', showTextFormatOptions)

    /** chapter click in table of content event **/
    $(document).on('click', '.chapter-toc', scrollToChapter);

    /** reading options container clicked event **/
    $(document).on('click', '.style-btn-container', styleBtnContainerClickCallBack);

    /** Window resize event : check visible pages and load content **/
    $(window).resize(function(e) {
        if($('#reading-parent-container').hasClass('in-active')) {
            return;
        }

        scrollEndCallBack();
        scrollingCallBack();
    });
})

/** reading option container clicked callback : if any popup visible hide etc. **/
function styleBtnContainerClickCallBack(e) {
    toggleFootnotePopup('hide');
}

/** Scroll to a given chapter in reading view **/
function scrollToChapter(e) {
    var ele = $(e.target),
        id,
        chapterEle,
        eleOffset,
        parentContainerScrollPosition = $(_chapter_parent_container_selector_commissioned_).scrollTop();

    if(!ele.hasClass('chapter-toc')) {
        mainEle = ele.closest('.chapter-toc')[0];
    } else {
        mainEle = ele;
    }

    id = $(mainEle).attr('id');
    eleOffset = $('.chapter-container#' + id).position().top;
    scrollTop = parentContainerScrollPosition + eleOffset;

    $(_chapter_parent_container_selector_commissioned_).animate({
        scrollTop: scrollTop
    }, 500);

}

/** text formatting options btn cliked **/
function showTextFormatOptions(e) {
    $('.table-of-content').hide();
    $('.text-format').show();
    $('.option-expanded').fadeIn();
}

/** TOC triggered **/
function showTableOfContent(e) {

    $('.table-of-content').show();
    $('.text-format').hide();
    $('.option-expanded').fadeIn();
}

/** show/hide reading options **/
function toggleReadingOptions(e) {
    toggleFootnotePopup('hide');
    $('.style-btn-container').fadeIn();
}

/** reading container clicked : some handling like hiding popups and closing reading options etc. **/
function chapterParentContainerClickCallback(e) {
    var targetElement = $(e.target),
        isFootnoteVisible = $(_footnote_popup_selector_).css('display');

    if(!targetElement.hasClass('footnote-activator')) {
        if(isFootnoteVisible != 'none')
            toggleFootnotePopup('hide');
    }

    $('.style-btn-container, .option-expanded, .table-of-content, .text-format').hide();
}

/** text formatting btns : on click change style **/
function updateIconStyle(dataObj) {
    if(!dataObj || !dataObj.value) return;

    if(dataObj.type === 'bgColor') {
        $(".background-color-update").removeClass('active');
        $(".background-color-update." + dataObj.value).addClass('active');
    } else if(dataObj.type === 'lineHeight') {
        $(".line-height-update").removeClass('active');
        $(".line-height-update." + dataObj.value).addClass('active');
    } else if(dataObj.type === 'fontSize') {
        $(".font-size-update").removeClass('active');
        $(".font-size-update." + dataObj.value).addClass('active');
    }
}

/** Line height modification as argument passed **/
function modifyLineHeight(lineHeight) {
    var obj = {
        selector : _chapter_parent_container_selector_commissioned_,
        classToRemove : _styling_classes_obj_['lineHeightStyle']['currentActiveClass'](),
        classToAdd : _styling_classes_obj_['lineHeightStyle']['nextLineHeight'](lineHeight),
        defaultStyle : _styling_classes_obj_['lineHeightStyle']['getDefaultValue'](),
    }

    updateIconStyle({type : 'lineHeight', value : (lineHeight === 'default' ? obj.defaultStyle : lineHeight)});

    modifyClassesForSelector(obj);
}

/** Font size modification as argument passed **/
function modifyFontSize(fontSize) {
    var obj = {
        selector : _chapter_parent_container_selector_commissioned_,
        classToRemove : _styling_classes_obj_['fontSizeStyle']['currentActiveClass'](),
        classToAdd : _styling_classes_obj_['fontSizeStyle']['nextFontSize'](fontSize),
        defaultStyle : _styling_classes_obj_['fontSizeStyle']['getDefaultValue']()
    }

    updateIconStyle({type : 'fontSize', value : (fontSize === 'default' ? '' : fontSize)});

    modifyClassesForSelector(obj);
}

/** Background color modification as argument passed **/
function modifyBackgroundColor(bgColor) {
    var obj = {
        selector : _chapter_parent_container_selector_commissioned_,
        classToRemove : _styling_classes_obj_['backgroundColorStyle']['currentActiveClass'](),
        classToAdd : _styling_classes_obj_['backgroundColorStyle']['nextBackgroundColor'](bgColor),
        defaultStyle : _styling_classes_obj_['backgroundColorStyle']['getDefaultValue'](),
    }

    updateIconStyle({type : 'bgColor', value : (bgColor === 'default' ? obj.defaultStyle : bgColor)});

    updateBGColorForReadingOptions(bgColor);

    modifyClassesForSelector(obj);
}

/** Update/remove classes a/c to the passed info **/
function modifyClassesForSelector(dataObj) {
    var selector = dataObj.selector,
        classToAdd = dataObj.classToAdd,
        classToRemove = dataObj.classToRemove;

    if(selector) {
        if(classToRemove) $(selector).removeClass(classToRemove);
        if(classToAdd) $(selector).addClass(classToAdd);
    }
}

/** Updating background color for all the elements as reading background changed by user **/
function updateBGColorForReadingOptions(color) {
    var eleSelector = ".option-trigger-btn, .style-btn-container, #tooltip-container";
    if(color === 'black') {
        $(eleSelector).removeClass('background-white').addClass('background-black');
    } else {
        $(eleSelector).removeClass('background-black').addClass('background-white');
    }
}

/** on scroll check and save first element in viewport and current scroll position **/
function saveCurrentScrollAndFirstElement(dataObj, visibleContentInViewPort) {
    var windowScroll = $(_chapter_parent_container_selector_commissioned_).scrollTop(),
        visibleFirstElementDetail = topMostContentIdInViewport({viewportVisibleContentInfo : visibleContentInViewPort});

    if(!dataObj) return;

    dataObj.visibleFirstElement = dataObj.visibleFirstElement ? dataObj.visibleFirstElement : {};

    dataObj.visibleFirstElement['pageNumber'] = visibleFirstElementDetail['pageNumber'];
    dataObj.visibleFirstElement['cId'] = visibleFirstElementDetail['cId'];
    dataObj.visibleFirstElement['topOffset'] = visibleFirstElementDetail['topOffset'];
    dataObj.visibleFirstElement['segmentId'] = visibleFirstElementDetail['segmentId'];

    dataObj.scrollPosition = windowScroll;

    return dataObj;
}

/** Maintain visible content position as user changes font size, line height etc. **/
function maintainVisibleViewportContentsPosition(dataObj) {
    var parentContainerSelector = _chapter_parent_container_selector_commissioned_,
        currentWindowScroll = getScrollPosition({selector : parentContainerSelector}),
        visibleFirstElementDetail = dataObj.visibleFirstElement,
        previewWindowScroll = dataObj.scrollPosition,
        cId = visibleFirstElementDetail.cId,
        pageNumber = visibleFirstElementDetail.pageNumber;

    if(!pageNumber || !cId) return;

    var firstVisibleElementSelector = _chapter_parent_container_selector_commissioned_ + " div[data-page-number='" + pageNumber + "'] #" + cId,
        firstElementOffsetPrevious = visibleFirstElementDetail.topOffset,
        firstElementOffsetCurrent = $(firstVisibleElementSelector).offset().top,
        windowScrollPositionToUpdate;

    if(firstElementOffsetPrevious > firstElementOffsetCurrent) {
        var diff = firstElementOffsetPrevious - firstElementOffsetCurrent;
        windowScrollPositionToUpdate = currentWindowScroll - diff;

    } else if(firstElementOffsetPrevious < firstElementOffsetCurrent) {
        var diff = firstElementOffsetPrevious - firstElementOffsetCurrent;
        windowScrollPositionToUpdate = currentWindowScroll - diff;
    }

    scrollToGivenElement({selector : parentContainerSelector, scrollTop : windowScrollPositionToUpdate});
}

/** Get scroll position for given element **/
function getScrollPosition(dataObj) {
    var selector = dataObj.selector;
    if(selector)
        return $(selector).scrollTop();
}

/** update css styling for given elements as selector **/
function modifyStyleOfSelectors(dataObj) {
    var selector = dataObj.selector;
    var style = dataObj.styles;

    $(selector).css(style);

}

/** Reading view scrolling call back to update page number etc... **/
function scrollingCallBack(e) {
    showPageNumber(e);
    toggleFootnotePopup('hide');
}

/** Binding reading container with scroll event **/
function bindChapterContainerOnScroll(callBack) {
    $(_chapter_parent_container_selector_commissioned_).scroll(callBack);
}

/** Binding scroll end event in reading main container **/
function bindChapterContainerScrollEnd(callBack) {
    $.fn.scrollEnd = function(callback, timeout) {
        $(this).scroll(function(){
            var $this = $(this);
            if ($this.data('scrollTimeout')) {
                clearTimeout($this.data('scrollTimeout'));
            }
            $this.data('scrollTimeout', setTimeout(callback,timeout));
        });
    };

    $(_chapter_parent_container_selector_commissioned_).scrollEnd(callBack, 50);
}

/** When scroll stops do required things such as getting pages, updating content etc... **/
function scrollEndCallBack() {
    // var viewportVisibleContentInfo = viewportVisibleContentInfo ? viewportVisibleContentInfo : {pageNumberList : []};
    var viewportVisibleContentInfo = getSegmentsInViewPort({shouldCheckIsPageLoaded : true});
    var pageNumberList = viewportVisibleContentInfo ? viewportVisibleContentInfo.pageNumberList : [];

    var nonRepeatedPageNumbers = pageNumberList.filter(function(n, i) {
        return (_fetching_page_numbers_.indexOf(n) === -1);
    });

    if(nonRepeatedPageNumbers.length != 0) {
        updateArray(nonRepeatedPageNumbers, _fetching_page_numbers_, 'push');
        getSegments(nonRepeatedPageNumbers, formatPagesDetail);

        saveCurrentScrollAndFirstElement(_visible_viewport_element_obj_, viewportVisibleContentInfo);
    }
}

/** Get all visible pages in view port wrapper (removing duplicates etc.) **/
function getSegmentsInViewPort(args) {
    var chapterParentContainerScrollPos = $(_chapter_parent_container_selector_commissioned_).scrollTop(),
        firstElement = 1,
        lastElement = _max_page_number_,
        chapterElems = $(_chapter_parent_container_selector_commissioned_ + " .chapter-container"),
        chapterParentContainerScrollPos = $(_chapter_parent_container_selector_commissioned_).scrollTop(),
        firstVisiblePageNumber = firstPageInViewPort(firstElement, lastElement, chapterParentContainerScrollPos),
        windowHeight = window.innerHeight,
        visiblePageNumbers;

    if(!firstVisiblePageNumber) return;

    visiblePageNumbers = getAllPagesInViewPort(Object.assign({}, {firstVisiblePageNumber : firstVisiblePageNumber}, args));

    return {pageNumberList : visiblePageNumbers, firstVisiblePage : firstVisiblePageNumber};
}

/** Getting all pages in view port, while first visible page is given **/
function getAllPagesInViewPort(args) {
    var visiblePageNumbers = [],
        windowHeight = window.innerHeight;

    for(var i = args.firstPageNumber; i <= _max_page_number_; i++) {
        var ele = $('div[data-page-number="'+i+'"]'),
            offsetTop = ele.offset().top
            isLoaded = (args.shouldCheckIsPageLoaded) ? ele.hasClass('is-loaded') : false;
        if(offsetTop > windowHeight) {
            if(!isLoaded) visiblePageNumbers.push(i);
            break;
        } else if(!isLoaded) {
            visiblePageNumbers.push(i);
        }
    }

    return visiblePageNumbers;
}

/** Update first page number in viewport to the page number circle on bottom **/
function showPageNumber(e) {
    var firstVisiblePageNumber = getFirstVisibleElementWhileScrolling();
    if(firstVisiblePageNumber) {
        $('#current-first-visible-page-number')[0].innerHTML = firstVisiblePageNumber;
/**
        var currentShownPageNumber = $('#current-first-visible-page-number')[0].innerHTML;
            currentShownPageNumber = Number.isNaN(currentShownPageNumber * 1) ? 1 : currentShownPageNumber * 1;

        if(firstVisiblePageNumber > currentShownPageNumber) {
            for(; currentShownPageNumber <= firstVisiblePageNumber; currentShownPageNumber++) {
                $('#current-first-visible-page-number')[0].innerHTML = currentShownPageNumber;
            }
        } else if(firstVisiblePageNumber < currentShownPageNumber) {
            for(; currentShownPageNumber >= firstVisiblePageNumber; currentShownPageNumber--) {
                $('#current-first-visible-page-number')[0].innerHTML = currentShownPageNumber;
            }
        } else {
            // do nothing... :p
        }

*/
    }
}

/** First visible element in viewport while still scrolling **/
function getFirstVisibleElementWhileScrolling() {
    var chapterParentContainerScrollPos = $(_chapter_parent_container_selector_commissioned_).scrollTop(),
        firstVisiblePageNumber = firstPageInViewPort(1, _max_page_number_, chapterParentContainerScrollPos);

    return firstVisiblePageNumber;
}

/** Check and find first visible element in viewport using binary search **/
function firstPageInViewPort(low, high, windowScrollPos) {
    // todo : task is to find nearest minimum offsetTop wala element...
    var windowHeight = window.innerHeight;

    if(windowScrollPos === 0) {
        return 1;
    }

    if(low >= high) {
        return low;
    }

    var mid = Math.floor((low + high) / 2);
    var offsetTop = $('div[data-page-number="'+mid+'"]').offset().top;

    if(offsetTop < 0) {
        var nextPageNumber = mid + 1;
        if(nextPageNumber <= _max_page_number_) {
            var nextOffsetTop = $('div[data-page-number="'+nextPageNumber+'"]').offset().top;
            if(nextOffsetTop >= 0) {
                return mid;
            }
        }
        return firstPageInViewPort(mid, high, windowScrollPos);
    } else if(offsetTop > 0) {
        var prevPageNumber = mid - 1;
        if(prevPageNumber > 0) {
            var prevOffsetTop = $('div[data-page-number="'+prevPageNumber+'"]').offset().top;
            if(prevOffsetTop <= 0) {
                return prevPageNumber;
            }
        }
        return firstPageInViewPort(low, mid, windowScrollPos);
    } else {
        return mid;
    }
}

/** Find first visible C tag in viewport **/
function topMostContentIdInViewport(dataObj) {
    var chapterParentContainerScrollPos = $(_chapter_parent_container_selector_commissioned_).scrollTop(),
        windowHeight = window.innerHeight,
        viewportVisibleContentInfo = dataObj.viewportVisibleContentInfo || getSegmentsInViewPort({shouldCheckIsPageLoaded : false}),
        pageNumberList = viewportVisibleContentInfo ? viewportVisibleContentInfo.pageNumberList : [],
        firstVisiblePageNumber = '',
        firstVisibleCId = '';

    pageNumberList.sort();

    for(var i = 0; i < pageNumberList.length; i++) {
        var pNo = pageNumberList[i],
            ele = $(_chapter_parent_container_selector_commissioned_ + " div[data-page-number='"+pNo+"']"),
            cTags = ele.find('c'),
            topOffset;

        for(var j = 0; j < cTags.length; j++) {
            var cTag = cTags[j],
                cOffset = $(cTag).offset().top,
                scrollPos = cOffset + chapterParentContainerScrollPos;

            if(scrollPos >= chapterParentContainerScrollPos && scrollPos <= chapterParentContainerScrollPos + windowHeight) {
                firstVisiblePageNumber = pNo;
                firstVisibleCId = $(cTag).attr('id');
                topOffset = cOffset;
                break;
            }
        }

        if(firstVisiblePageNumber && firstVisibleCId) break;
    }

    return {
        pageNumber : firstVisiblePageNumber,
        cId : firstVisibleCId,
        topOffset : topOffset,
        segmentId : $("[data-page-number='" + firstVisiblePageNumber + "']")[0].getAttribute('id')
    }
}

/** Not in use abhi **/
function getUserCreds() {
    // todo : get user creds if required
}

/** Not in use abhi **/
function validateUserForBook(callBack) {

    $('.chapter-parent-container').hide();

    var queryParams = location.search,
        parsedParams = queryParams.split('&'),
        userId, bookId, clientName, viewType,
        validClients = ['railyatri'];

    parsedParams.forEach(function(param, ind) {
        if(param.indexOf('user_id') != -1) {
            var arr = param.split('user_id=');
            userId = arr[arr.length - 1];
        } else if(param.indexOf('book_id') != -1) {
            var arr = param.split('book_id=');
            bookId = arr[arr.length - 1];
        } else if(param.indexOf('guest') != -1) {
            var arr = param.split('guest=');
            clientName = arr[arr.length - 1];
        } else if(param.indexOf('view_type') != -1) {
            var arr = param.split('view_type=');
            viewType = arr[arr.length - 1];
        }
    })

    if(validClients.indexOf(clientName) === -1) {
        screenOverlayHandler({action : 'show', type : 'error', msg : 'Oops! You are not a authorized guest user.'});
        return;
    }

    if(userId && bookId) {
        // todo : make an ajax call and verify
        var validate = 'success'
        if(validate === 'success') {
            __USER_ID__ = userId;
            __BOOK_ID__ = bookId;
            __CLIENT_NAME__ = clientName;
            __VIEW_TYPE__ = viewType;
            // todo : setAuthToken over here
            parentReadingContainerToggle('show');
            callBack();
        } else {
            screenOverlayHandler({action : 'show', type : 'error', msg : 'Oops! You are trying to access invalid url.'});
        }
    } else {
        if(!userId)
            screenOverlayHandler({action : 'show', type : 'error', msg : 'Oops! You are not a valid user to access this url.'});
        else if(!bookId)
            screenOverlayHandler({action : 'show', type : 'error', msg : 'Oops! Book you want to read does not exist.'});
        else
            screenOverlayHandler({action : 'show', type : 'error', msg : 'Oops! You are trying to access invalid url.'});
    }
}

/** show/hide reading container while loading or in case we get an erro **/
function parentReadingContainerToggle(action) {
    if(action === 'show')
        $('#reading-parent-container').removeClass('in-active');
    else if(action === 'hide')
        $('#reading-parent-container').addClass('in-active');
}

/** URL mapper ***/

function ajaxUrlGetter(dataObj) {
    var reqUrl = "";
    if(!dataObj) return reqUrl;

    if(!isReqArgumentsPresent(dataObj)) return reqUrl;

    if(dataObj.reqType === 'getChaptersCommissioned') {
        reqUrl = __BASE_URL__ + "yatri/user/" + dataObj.userId + "/book/" + dataObj.bookId + "/read/";
    } else if(dataObj.reqType === 'getPagesCommissioned') {
        reqUrl = __BASE_URL__ + "yatri/user/" + dataObj.userId + "/book/" + dataObj.bookId + "/read/pages/?" + dataObj.pageStr;
    } else if(dataObj.reqType === 'saveLastReadLocation'){
        reqUrl = "http://staging.juggernaut.in/" + "yatri/user/" + dataObj.userId + "/book/" + dataObj.bookId + "/last-read-location/";
    } else if(dataObj.reqType === 'getPreviewChaptersCommissioned'){
        reqUrl = "http://staging.juggernaut.in/" + "yatri/books/" + dataObj.bookId + "/preview/";
    }

    return reqUrl;
}

/** All arguments for ajax url mapping validator **/
function isReqArgumentsPresent(dataObj) {
    if(!dataObj) return false;

    var isValidArgs = true;

    var reqParams = {
        getChaptersCommissioned : ['userId', 'bookId'],
        getPagesCommissioned : ['userId', 'bookId', 'pageStr'],
        saveLastReadLocation : ['userId', 'bookId'],
        getPreviewChaptersCommissioned : ['bookId']
    }

    var reqType = dataObj.reqType;
    var reqArgs = reqParams[reqType];

    reqArgs.forEach(function(a, i) {
        if(!dataObj[a]) isValidArgs = false;
    });

    return isValidArgs;
}

/** Fetch all the chapters for this book **/
function getChaptersCommissioned(callback) {
    var getChapterUrl = ajaxUrlGetter({reqType : 'getChaptersCommissioned', userId : __USER_ID__, bookId : __BOOK_ID__});

    if(!getChapterUrl) return;

    $.ajax({
        url : getChapterUrl,
        method : "GET",
        headers : {
            Authorization : __AUTH_TOKEN__
        },
        success : function(data, status){
            if(data) {
                if(callback) {
                    callback(data, insertChapters);
                } else {
                    // todo : think what to do...
                }
            } else {
                // todo : content nhi mila yr :/
            }
        },
        error : function(data, status) {
            errorHandler({data : data, status : status, errorType : 'API'});
            // userVerificationFailed(data, status);
        }
    });
}

/** Format chapter details for current book **/
function formatReadDetailsCommissioned(data, callback){
    var bookDetails = data.book_details;
    var lastReadLoc = data.last_read_loc || {};
    if(bookDetails) {
        var chapterData = bookDetails.chapter_data || [];
        if(callback) {
            callback({chapterData : chapterData, lastReadLoc : lastReadLoc});
        } else {
            // todo : think what to do...
        }
    } else {
        // todo : error handling
    }
}

/** Fetch all the chapters for preview of this book **/
function getPreviewChaptersCommissioned(callback) {
    var getPreviewChapterUrl = ajaxUrlGetter({reqType : 'getPreviewChaptersCommissioned', bookId : __BOOK_ID__});

    if(!getPreviewChapterUrl) return;

    $.ajax({
        url : getPreviewChapterUrl,
        method : "GET",
        headers : {
            // Authorization : __AUTH_TOKEN__
        },
        success : function(data, status){
            if(data) {
                if(callback) {
                    callback(data, insertChapters);
                } else {
                    // todo : think what to do...
                }
            } else {
                // todo : content nhi mila yr :/
            }
        },
        error : function(data, status) {
            errorHandler({data : data, status : status, errorType : 'API'});
            // userVerificationFailed(data, status);
        }
    });
}

/** Format chapter details for current book **/
function formatPreviewDetailsCommissioned(data, callback){
    var previewData = data.preview || {};
    var segmentData = {
        segment_data : previewData.segment_data || [],
        image_data : previewData.image_data || {},
        footnotes_data : previewData.footnotes_data || {}
    }
    if(previewData.chapter_data) {
        if(callback) {
            callback({chapterData : previewData.chapter_data || []}, insertPages, segmentData);
        } else {
            // todo : think what to do...
        }
    } else {
        // todo : error handling
    }
}

function insertPreviewPagesCommissioned(data, callback) {

}

/** concat pageIds list to query string **/
function arrayToPageIdString(idArr) {
    var idStr = "";
    idArr.forEach(function(pn, i) {
        idStr += 'page=' + pn + '&';
    })

    return idStr;
}

/** Modify and update array : as remove elements and add elements **/
function updateArray(newList, currentList, action) {
    newList.forEach(function(l, i) {
        var indexOfEle = currentList.indexOf(l);
        if(action === 'push') {
            if(indexOfEle === -1) currentList.push(l);
        } else if(action === 'pop'){
            if(indexOfEle != -1) currentList.splice(indexOfEle, 1);
        }
    })
}

/** Get pages for given page ids **/
function getSegments(pageIds, formatPagesDetailCallBack) {
    var pageIds = pageIds.sort();
    var pagesIdString = arrayToPageIdString(pageIds);

    var getSegmentsUrl = ajaxUrlGetter({userId : __USER_ID__, bookId : __BOOK_ID__, pageStr : pagesIdString, reqType : 'getPagesCommissioned'})

    if(!getSegmentsUrl) return;

    if(pageIds.length > 0) {
        $.ajax({
            url : getSegmentsUrl,
            method : "GET",
            headers : {
                Authorization : __AUTH_TOKEN__
            },
            success : function(data, status){
                if(data) {
                    if(formatPagesDetailCallBack) {
                        formatPagesDetailCallBack(data, insertPages);
                    } else {
                        // todo : ab tera kya hoga kaliya...
                    }
                }
            },
            error : function(data, status) {
                updateArray(pageIds, _fetching_page_numbers_, 'pop');
                errorHandler({data : data, status : status, errorType : 'API'});
            }
        });
    }
}

/** initiate insert pages call back **/
function formatPagesDetail(data, callBack) {
    var segmentData = data.segment_data;
    if(segmentData && segmentData.length > 0) {
        callBack(data);
    } else {
        // todo : empty content
    }
}

/** Iterate and start inserting pages over here **/
function insertPages(data) {
    var segmentData = data.segment_data,
        imageData = data.image_data,
        footnotesData = data.footnotes_data;

    _all_images_data_ = Object.assign(_all_images_data_, imageData);
    _all_footnotes_data_ = Object.assign(_all_footnotes_data_, footnotesData);

    if(segmentData) {
        segmentData.forEach(function(e, i) {
            var pageNumber = e.page_number;

            if(pageNumber) {
                var imgIds = collectImgIdFromHtml(e.content || "");
                var imgInfoObj = {
                    htmlStr : e.content || "",
                    urlType : 'juggernautUrl',
                    whereToUpdate : '',
                    urlHash : imageData,
                    idsToUpdate : imgIds
                }

                if(imgIds && imgIds.length > 0) {
                    var contentObj = updateImgUrlInHtml(imgInfoObj);
                    var contentWithImages = contentObj.htmlStr;
                    e.content = contentWithImages;
                } else {
                    // todo : fotu nhi hai bhai, kuch nhi karna chal aage chalte hai ab :p
                }

                updateArray([pageNumber], _loaded_page_numbers_, 'push');
                updateSingleSegmentContainerContent(e);
            }
            updateArray([pageNumber], _fetching_page_numbers_, 'pop');
        })
        screenOverlayHandler({action : 'hide', type : 'page-loading'});
    } else {
        // todo : woooooo
    }
}

/** process last read location and scroll page to that position and load those pages **/
function updateLastReadLocation(data) {
    if(data) {
        var pageNumber = data.last_read_page;
        var pageNumbersToFetch;
        var selector = _chapter_parent_container_selector_commissioned_, scrollTop;
        if(pageNumber && pageNumber > 1) {
            scrollTop = $("div[data-page-number='" + pageNumber + "']").position().top;
            pageNumbersToFetch = [pageNumber-1, pageNumber, pageNumber+1];
        } else {
            pageNumbersToFetch = [1, 2, 3];
        }

        scrollToGivenElement({selector : selector, scrollTop : scrollTop});

        var nonRepeatedPageNumbers = pageNumbersToFetch.map(function(n, i) {
            if(_fetching_page_numbers_.indexOf(n) === -1) return n;
        });
        updateArray(nonRepeatedPageNumbers, _fetching_page_numbers_, 'push');
        getSegments(nonRepeatedPageNumbers, formatPagesDetail);
    }

    checkPageNumberUpdateAndSaveLastReadLocation();

    // showPageNumber();
}

/** Insert chapter containers **/
function insertChapters(data, callBack, callBackArgs) {
    var chapterData = data.chapterData;
    buildTOC(chapterData);
    if(chapterData.length > 0) {
        chapterData.forEach(function(ch, i) {
            insertSingleChapter(ch);
        })
        updateLastReadLocation(data.lastReadLoc);

        if(callBack) {
            callBack(callBackArgs);
        }
    }
}

/** TOC formation **/
function buildTOC(data) {
    var mainChapterCount = 1;
    data.forEach(function(ch, i) {
        var chId = ch.chapter_id,
            chHeading = ch.heading_data ? ch.heading_data.html : "",
            startPage = ch.starting_page_number,
            chType = ch.chapter_type,
            chName = (function(chName, chType) {
                if(chType === 1) {
                    chName = chName ? chName : "Preface"
                } else if(chType === 2) {
                    chName = chName ? chName : "Chapter"
                } else if(chType === 3) {
                    chName = chName ? chName : "Post chapter"
                }
                return chName;
            })(ch.chapter_name, chType),
            chString = getChapterStringToAppendInTOC({chName : chName, startPage : startPage, chIndex : mainChapterCount, chType : chType, chId : chId});

        updateChapterInTOC({chType : chType, chString : chString});
        mainChapterCount = (chType === 2) ? mainChapterCount + 1 : mainChapterCount;
    })
}

/** adding a single chapter in Table of content **/
function updateChapterInTOC(data) {
    if(!data) return;
    if(data.chType === 1) {
        $('.toc-chapter-list').append(data.chString);
    } else if(data.chType === 2) {
        $('.toc-chapter-list').append(data.chString);
    } else if(data.chType === 3) {
        $('.toc-chapter-list').append(data.chString);
    }
}

/** Formatting chapter content for TOC and return a html string to update **/
function getChapterStringToAppendInTOC(dataObj) {
    if(!dataObj) return "";

    chIndexStr = (dataObj.chType === 2) ? '<div class = "chapter-index">'+dataObj.chIndex+'</div>' : '';

    return '<div class = "chapter-toc" id = "'+dataObj.chId+'">' +
                chIndexStr +
                '<div class = "chapter-name-text">'+dataObj.chName+'</div>' +
                '<div class = "chapter-start-page">'+dataObj.startPage+'</div>' +
            '</div>';
}

/** Insert Single chapter container **/
function insertSingleChapter(data) {
    if(data && data.chapter_id) {
        var chapterHTML = singleChapterContainer(data);
        $(_chapter_parent_container_selector_commissioned_).append(chapterHTML);
        insertPageContainer(data);

        updateChapterInTOC(data);

    } else {
        // todo : think what to do...
    }
}

/** Insert empty page container **/
function insertPageContainer(data) {
    var pageCount = data.page_count;
    var chapterId = data.chapter_id;
    var startingPageNumber = data.starting_page_number;
    if(data.page_count > 0) {
        for(var i = startingPageNumber; i < startingPageNumber + pageCount; i++) {
            var dataObj = {
                pageNumber : i,
                chapterId : chapterId
            }
            insertSinglePage(dataObj)
        }
    }
}

/** Insert single page container **/
function insertSinglePage(data) {
    var pageNumber = data.pageNumber;
    var chapterId = data.chapterId;
    if(data && data.pageNumber) {
        var pageHTML = singlePageContainer(data);
        $("#"+chapterId).append(pageHTML);
        _max_page_number_ = data.pageNumber;
    }
}

/** return chapter container template **/
function singleChapterContainer(data) {
    var chapterContainer = "<div class = 'chapter-container' id = '" + data.chapter_id + "'>" +
            "<div class = 'chapter-heading-container'>"+ data.heading_data.html +"</div>" +
        "</div>";

    return chapterContainer;
}

/** return single page container template **/
function singlePageContainer(data) {
    return "<div class = 'chapter-segment-container' data-page-number = " + data.pageNumber + ">" +
              "<div class = 'chapter-segment-placeholder'></div>"+
          "</div>";
}

/** Insert content to a page container **/
function updateSingleSegmentContainerContent(data) {
    var pageNumber = data.page_number;
    var content = data.content;
    var segmentId = data.segment_id;

    var selectorString = "div[data-page-number='" + pageNumber + "']";

    $(selectorString).html(content);
    $(selectorString).attr({"id" : segmentId});
    $(selectorString).addClass("is-loaded");
}

/** Fetch all image ids from a page content **/
function collectImgIdFromHtml(data) {
    var htmlStr = data || "";
    var imgIdsList = [];

    if(!htmlStr) return imgIdsList;

    var imgTags = $(htmlStr).find('img');

    if(imgTags && imgTags.length > 0) {
        for(var i = 0; i < imgTags.length; i++) {
            var im = imgTags[i];
            var imgId = $(im).attr("id");
            if(imgId) {
                imgIdsList.push(imgId);
            }
        }
    }
    return imgIdsList;
}

/** Not in use abhi **/
function getImageUrlBaseOnImageId(data) {
    // todo : ajax call karni hai bey samaj nhi aata kya teko bc

}

/** Update image url in page html string **/
function updateImgUrlInHtml(data) {
    // todo : u la la, u la la

    var htmlStr = data.htmlStr;
    var urlType = data.urlType;
    var whereToUpdate = data.whereToUpdate
    var urlHash = data.urlHash;
    var idsToUpdate = data.idsToUpdate || [];

    if(urlType === 'placeholderUrl') {

    } else if(urlType === 'juggernautUrl') {
        var $htmlStr = $(htmlStr);
        $htmlStr.find('img').each(function(index, im) {
            var imgId = $(this).attr("id");

            var urlObj = urlHash[imgId] || {};
            var url = urlObj.signed_url || "../images/segment_placeholder.png";

            $(this).attr({src : url});
        })

        htmlStr = $htmlStr.wrapAll($('<div/>')).parent().html();
    }

    data.htmlStr = htmlStr;
    return data;
}

/** Not in use abhi **/
function getSavedUserPreferences() {
    // todo : get from server
    // todo : get from cookies
    // todo : udpate user preferences saved

    // todo : if nothing found, set default

    var dataObj = {updateUserPreferences : 'default'};

    updateUserPreferences(dataObj);

}

function updateUserPreferences(dataObj) {
    if(!dataObj) return;
    if(dataObj.updateUserPreferences === 'default') {
        modifyBackgroundColor('default');
        modifyFontSize('default');
        modifyLineHeight('default');
    } else {

    }
}

/** Not in use abhi **/
function getUserBookHighlights() {
    // todo : get book highlights
}

/** Scroll a given element to given position **/
function scrollToGivenElement(data) {
    var selector = data.selector,
        scrollPos = data.scrollTop,
        timeout = data.timeout || 0;

    $(selector).animate({
        scrollTop : scrollPos
    }, timeout);
    // $(selector).scrollTop(pos);
}

/** Show hide loader **/
function screenOverlayHandler(dataObj) {
    if(dataObj.action === 'show') {
        $('.display-message').addClass('in-active');
        if(dataObj.msg) $('.screen-message-overlay .msg').html(dataObj.msg);
        if(dataObj.type === 'error') {
            $('.screen-message-overlay .error-page').removeClass('in-active');
        } else if(dataObj.type === 'page-loading') {
            $('.screen-message-overlay .page-loading').removeClass('in-active');
        }
        $('.screen-message-overlay').show();
    } else if(dataObj.action === 'hide') {
        $('.screen-message-overlay').hide();
        $('.display-message').addClass('in-active');
    }
}

/** Ajax error handler **/
function errorHandler(dataObj) {
    if(dataObj.errorType === 'API') {
        var statusCode = dataObj.data.status;
        if(statusCode === 403) {
            screenOverlayHandler({action : 'show', type : 'error', msg : 'Oops! You are not allowed to access this page.'});
        } else if(statusCode === 500) {
            screenOverlayHandler({action : 'show', type : 'error', msg : 'Oops! Something went wrong, please be with us and try again.'});
        } else if(statusCode === 400) {
            screenOverlayHandler({action : 'show', type : 'error', msg : 'Oops! Something went wrong, please be with us and try again.'});
        } else if(statusCode === 404) {
            screenOverlayHandler({action : 'show', type : 'error', msg : 'Oops! This page does not exist.'});
        } else {
            screenOverlayHandler({action : 'show', type : 'error', msg : 'Oops! Something went wrong, please be with us and try again.'});
        }
    } else {

    }
}

/** Calculation for footnote popup position and showing and scrolling if needed **/
function footnoteTriggerCallback(e) {
    var footnoteId = $(e.target).attr('id'),
        footnoteDetailObj,
        windowScrollToUpdate,
        popupOffsetFromFootnote = 20,
        footnoteActiveOffsetFromTop = 50,
        scrollParentContainer = 0,
        activeFootnoteId = $("#tooltip-container").attr('data-footnote-id'),
        currentWindowScroll = getScrollPosition({selector : _chapter_parent_container_selector_commissioned_}),
        windowHeight = window.innerHeight,
        animateFootnotePopupTimeout = 300,
        footnoteIconHeight = 20;

    if(!footnoteId || !_all_footnotes_data_[footnoteId]) {
        toggleFootnotePopup('hide');
        return;
    }

    if(activeFootnoteId === footnoteId) {
        return;
    } else {
        toggleFootnotePopup('hide');
    }

    footnoteDetailObj = _all_footnotes_data_[footnoteId];
    updateFootnotePopupContent({footnoteId : footnoteId});

    var footnoteSelector = "#" + footnoteDetailObj.chapter_id + " #" + footnoteDetailObj.segment_id + " #" + footnoteDetailObj.footnote_id;

    var footnoteOffset = $(footnoteSelector).offset().top,
        footnotePopupMaxHeight = Math.floor(windowHeight * 0.7);

    $(_footnote_popup_selector_).css({'max-height' : footnotePopupMaxHeight + 'px'});
    // $(_footnote_popup_selector_ + ' .inner-container').css({'max-height' : footnotePopupMaxHeight + 'px'});

    if(footnoteOffset > footnoteActiveOffsetFromTop)
        scrollParentContainer = footnoteOffset - footnoteActiveOffsetFromTop;

    var visibleViewportBelowFootnote = windowHeight - footnoteOffset;

    var footnotePopupHeight = $(_footnote_popup_selector_).height();

    var scrollNeeded = false,
        footnotePopupPosition = 'bottom';

    if(footnotePopupHeight <= visibleViewportBelowFootnote - popupOffsetFromFootnote - footnoteIconHeight) {
        footnotePopupPosition = 'bottom';
    } else if(footnotePopupHeight <= footnoteOffset - popupOffsetFromFootnote) {
        footnotePopupPosition = 'top';
    } else {
        if(scrollParentContainer > 0) {
            windowScrollToUpdate = currentWindowScroll + scrollParentContainer;
            scrollToGivenElement({selector : _chapter_parent_container_selector_commissioned_, scrollTop : windowScrollToUpdate, timeout : animateFootnotePopupTimeout});
            scrollNeeded = true;
            footnotePopupPosition = 'bottom';
        }
    }

    setTimeout(function() {
        if(scrollNeeded)
            footnoteOffset = $(footnoteSelector).offset().top;

        var footnotePopupOffset;

        if(footnotePopupPosition === 'top') {
            footnotePopupOffset = footnoteOffset - popupOffsetFromFootnote - footnotePopupHeight;
        } else if(footnotePopupPosition === 'bottom') {
            footnotePopupOffset = footnoteOffset + popupOffsetFromFootnote + footnoteIconHeight;
        }

        $(_footnote_popup_selector_).css({top : footnotePopupOffset + 'px', 'max-height' : footnotePopupMaxHeight + 'px'});

        toggleFootnotePopup('show');
    }, animateFootnotePopupTimeout + 100);
}

/** Toggling footnote popup... i mean show/hide :p **/
function toggleFootnotePopup(action) {
    if(action === 'show') {
        $(_footnote_popup_selector_).fadeIn();
    } else {
        $("#tooltip-container").attr({'data-footnote-id' : ''});
        $(_footnote_popup_selector_).hide();
    }
}

/** updating given html content to footnote popup **/
function updateFootnotePopupContent(dataObj) {
    var id = dataObj.footnoteId,
        footnoteData = _all_footnotes_data_[id],
        htmlContentToAppendInPopup = footnoteData['footnote_data'];

    $('#tooltip-container .html-content')[0].innerHTML = htmlContentToAppendInPopup;
    $("#tooltip-container").attr({'data-footnote-id' : id});
}

/** Disable copy paste on a particular page */
function disableCopyPaste(dataObj) {
    // dataObj = {selector : '.somePageName'}
    // todo : disable on given page selector inside dataObj
}

/** Check if scroll position changed after 10 sec and update if required **/
function checkScrollPositionChangesAndUpdate(callBack) {
    /**
    1. update page number in view
    2. update last read location
    **/
    setTimeout(function() {
        callBack();
        checkScrollPositionChangesAndUpdate(callBack);
    }, _scrollPositionUpdateCronTimeout_)
}

/** Wrapper over save last read location **/

function checkPageNumberUpdateAndSaveLastReadLocation() {
    setTimeout(function() {
        saveLastReadLocation();
        checkPageNumberUpdateAndSaveLastReadLocation();
    }, _saveLastReadLocationTimeout_)
}

/** Save last read location **/
function saveLastReadLocation() {
    var viewportVisibleContentInfo = getSegmentsInViewPort({shouldCheckIsPageLoaded : false});
    var newLocationInfo = saveCurrentScrollAndFirstElement(_visible_viewport_element_obj_, viewportVisibleContentInfo);

    // var firstVisiblePageNumber = getFirstVisibleElementWhileScrolling();
    if(currentLocationInfo) {
        var saveLastReadLocURL = ajaxUrlGetter({reqType : 'saveLastReadLocation', userId : __USER_ID__, bookId : __BOOK_ID__});

        if(!saveLastReadLocURL) return;

        var lastReadLocDataObj = {
            last_read_book : __BOOK_ID__,
            last_read_segment : currentLocationInfo.segmentId,
            last_read_word : currentLocationInfo.cId,
            last_read_page : currentLocationInfo.pageNumber
        }

        var currentShownPageNumber = $('#current-first-visible-page-number')[0].innerHTML;

        if(newLocationInfo.pageNumber != currentShownPageNumber * 1) {
            $.ajax({
                url : getSegmentsUrl,
                method : "PUT",
                data : lastReadLocDataObj,
                dataType : 'application/json',
                headers : {
                    Authorization : __AUTH_TOKEN__
                },
                success : function(data, status){
                    if(data) {
                        if(formatPagesDetailCallBack) {
                            formatPagesDetailCallBack(data, insertPages);
                        } else {
                            // todo : ab tera kya hoga kaliya...
                        }
                    }
                },
                error : function(data, status) {
                    updateArray(pageIds, _fetching_page_numbers_, 'pop');
                    errorHandler({data : data, status : status, errorType : 'API'});
                }
            });
        }
    }
}
