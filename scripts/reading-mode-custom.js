pageLoading('show');
var __BASE_URL__ = "https://app.juggernaut.in/";
var __USER_ID__ = "3783332750f049d897092288d1566f6c";
var __BOOK_ID__ = "1bbad3af1be8408eadc998ff3c141ce9";
var __AUTH_TOKEN__ = "451dcb0916904a0caadab926a96a1944";

var _loaded_segment_ids_ = [];
var _loaded_page_numbers_ = [];
var _fetching_segment_ids_ = [];
var _fetching_page_numbers_ = [];
var _maxPageNumber_ = 1;

$(document).ready(function() {
    // $("#init-reading-btn").on('click', function(e) {
        getChapters(formatReadDetails);
        bindChapterContainerScrollEnd(scrollEndCallBack);
    // })
})

/** Binding scroll end event in reading main container***/
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

    $('#chapter-parent-container').scrollEnd(callBack, 10);
}

/** This will initiate getting pages call **/
function scrollEndCallBack(e) {
    var segmentIds = getSegmentsInViewPort();
    var nonRepeatedPageNumbers = segmentIds.filter(function(n, i) {
        return (_fetching_page_numbers_.indexOf(n) === -1);
    });

    updateArray(nonRepeatedPageNumbers, _fetching_page_numbers_, 'push');
    getSegments(nonRepeatedPageNumbers, formatPagesDetail);
}

/** Finding elements in viewport **/
function getSegmentsInViewPort() {
    var chapterElems = $(".chapter-container");
    var chapterParentContainerScrollPos = $('#chapter-parent-container').scrollTop();
    var windowHeight = window.innerHeight;
    var startPageNumber;
    var startChapterNumber;
    var pageNumberList = [];

    for(var i = 0; i < chapterElems.length; i++) {
        var chapterScrollPos = $(chapterElems[i]).offset().top + chapterParentContainerScrollPos;
        if(chapterScrollPos >= chapterParentContainerScrollPos) {
            if(i-1 >= 0) {
                var segments = $(chapterElems[i-1]).find(".chapter-segment-container");
                if(segments && segments.length > 0) {
                    startPageNumber = segments[0].getAttribute("data-page-number") * 1;
                    break;
                }
            }
        }
    }

    var cont = true;
    while(cont) {
        if(!startPageNumber || (startPageNumber > _maxPageNumber_)) {
            cont = false;
        } else {
            var ele = $("div[data-page-number='"+startPageNumber+"']");
            var scrollPos = $(ele).offset().top + chapterParentContainerScrollPos;
            var isLoaded = $(ele).hasClass('is-loaded');
            if(scrollPos >= chapterParentContainerScrollPos && scrollPos <= chapterParentContainerScrollPos + windowHeight) {
                if(!isLoaded)
                    pageNumberList.push(startPageNumber)
            } else if(scrollPos > chapterParentContainerScrollPos + windowHeight){
                if(!isLoaded)
                    pageNumberList.push(startPageNumber)
                cont = false;
            }
            startPageNumber += 1;
        }
    }

    if(pageNumberList.length > 0) {
        var prevNumber = pageNumberList[0] - 1;
        // var nextNumber = pageNumberList[pageNumberList.length - 1] + 1;

        if(prevNumber && prevNumber > 0 && pageNumberList.indexOf(prevNumber) === -1) pageNumberList.push(prevNumber);
        // if(nextNumber && nextNumber > 0 && pageNumberList.indexOf(nextNumber) === -1) pageNumberList.push(nextNumber);
    }

    return pageNumberList;
}

/** Not in use abhi **/
function getUserCreds() {

}

/** Not in use abhi **/
function validateUserForBook(data) {
    // todo : request and validate user for given bookId
}

/** Not in use abhi **/
function userVerificationFailed(data) {
    // todo : user is not verified for this call, so tell him ki 'bhai tumse na ho payega'.
}

/** Fetch all the chapters for this book **/
function getChapters(callback) {
    var getChapterUrl = __BASE_URL__ + "users/" + __USER_ID__ + "/books/" + __BOOK_ID__ + "/read/";
    $.ajax({
        url : getChapterUrl,
        method : "GET",
        headers : {
            Authorization : "Basic " + __AUTH_TOKEN__
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
            userVerificationFailed(data, status);
        }
    });
}

/** Format chapter details for current book **/
function formatReadDetails(data, callback){
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
    var getSegmentsUrl = __BASE_URL__ + "users/" + __USER_ID__ + "/books/" + __BOOK_ID__ + "/read/pages/" + (pagesIdString ? "?" + pagesIdString : "");

    if(pageIds.length > 0) {
        $.ajax({
            url : getSegmentsUrl,
            method : "GET",
            headers : {
                Authorization : "Basic " + __AUTH_TOKEN__
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
                //todo : error handling
                updateArray(pageIds, _fetching_page_numbers_, 'pop');
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
    var segmentData = data.segment_data;
    var imageData = data.image_data;
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
        pageLoading('hide');
    } else {
        // todo : woooooo
    }
}

/** process last read location and scroll page to that position and load those pages **/
function updateLastReadLocation(data) {
    var pageNumber = data.last_read_page;
    var pageNumbersToFetch;
    var selector = '#chapter-parent-container', scrollTop;
    if(pageNumber) {
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

/** Insert chapter containers **/
function insertChapters(data) {
    var chapterData = data.chapterData;

    if(chapterData.length > 0) {
        chapterData.forEach(function(ch, i) {
            insertSingleChapter(ch);
        })
        updateLastReadLocation(data.lastReadLoc);
        buildTOC(chapterData);
    }

    // getSegments(pagesIdString, insertPages)
}

/** Insert Single chapter container **/
function insertSingleChapter(data) {
    if(data && data.chapter_id) {
        var chapterHTML = singleChapterContainer(data);
        $("#chapter-parent-container").append(chapterHTML);
        insertPageContainer(data);
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
        _maxPageNumber_ = data.pageNumber;
    }
}

/** TOC formation **/
function buildTOC(data) {
    // todo : chumma... chumma de de...
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

}

/** Not in use abhi **/
function getUserBookHighlights() {

}

/** Not in use abhi **/
function scrollToGivenPosition() {

}

/** Scroll a given element to given position **/
function scrollToGivenElement(data) {
    var selector = data.selector;
    var pos = data.scrollTop;
    $(selector).scrollTop(pos);
}

/** Show hide loader **/
function pageLoading(action) {
    if(action === 'show') {
        $('#page-loading-container').removeClass('in-active');
    } else if(action === 'hide') {
        $('#page-loading-container').addClass('in-active');
    }
}
