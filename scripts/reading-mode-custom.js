var __BASE_URL__ = "https://app.juggernaut.in/";
var __USER_ID__ = "3783332750f049d897092288d1566f6c";
var __BOOK_ID__ = "c39f0c35e7174a8aa77b974dfbee2491";
var __AUTH_TOKEN__ = "451dcb0916904a0caadab926a96a1944";

$(document).ready(function() {

    var _loaded_segment_ids_ = [];
    var _loaded_page_numbers_ = [];

    $("#init-reading-btn").on('click', function(e) {
        getChapters(formatReadDetails);
    })

})

function getUserCreds() {

}

function validateUser() {

}

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
            }
        },
        error : function(data, status) {
            // todo : error handling
            // console.log(data);
        }
    });
}

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

function getSegments(pageIds, insertPagesCallBack) {
    var pagesIdString = arrayToPageIdString(pageIds);
    var getSegmentsUrl = __BASE_URL__ + "users/" + __USER_ID__ + "/books/" + __BOOK_ID__ + "/read/pages/" + (pagesIdString ? "?" + pagesIdString : "");

    $.ajax({
        url : getSegmentsUrl,
        method : "GET",
        headers : {
            Authorization : "Basic " + __AUTH_TOKEN__
        },
        success : function(data, status){
            if(data) {
                insertPagesCallBack(data);
            }
        },
        error : function(data, status) {
            //todo : error handling
        }
    });
}

function formatPagesDetail() {

}

function insertPages(data) {

}

function updateLastReadLocation(data) {
    var pageNumber = data.last_read_page;
    if(pageNumber) {
        var selectorString = "div[data-page-number='" + pageNumber + "']";
        var dataObj = {
            selectorString : selectorString
        }
        var pageNumbersToFetch = [pageNumber-1, pageNumber, pageNumber+1];
        scrollToGivenElement(dataObj);
        getSegments(pageNumbersToFetch, )
    } else {

    }
}

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

function insertSingleChapter(data) {
    if(data && data.chapter_id) {
        var chapterHTML = singleChapterContainer(data);
        $("#chapter-parent-container").append(chapterHTML);
        insertPageContainer(data);
    } else {
        // todo : think what to do...
    }
}

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

function insertSinglePage(data) {
    var pageNumber = data.pageNumber;
    var chapterId = data.chapterId;
    if(data && data.pageNumber) {
        var pageHTML = singlePageContainer(data);
        $("#"+chapterId).append(pageHTML);
    }
}

function buildTOC(data) {
    // todo : chumma chumma de de...
    console.log('building TOC');
}

function singleChapterContainer(data) {
    var chapterContainer = "<div class = 'chapter-container' id = '" + data.chapter_id + "'>" +
            "<div class = 'chapter-heading-container'>"+ data.heading_data.html +"</div>" +
        "</div>";

    return chapterContainer;
}

function singlePageContainer(data) {
    return "<div class = 'chapter-segment-container' data-page-number = " + data.pageNumber + ">" +
              "<div class = 'chapter-segment-placeholder'></div>"+
          "</div>";
}

function updateSingleSegmentContainerContent(data) {
    // todo : find by page number and update conetnt as well as segment_id;
    // return "<div class = 'segment-container' id = " + data.segment_id + ">" + data.content +"</div>";
}

function getSavedUserPreferences() {

}

function getUserBookHighlights() {

}

function scrollToGivenPosition() {

}

function scrollToGivenElement(data) {
    var selector = data.selectorString;
    // if(data.selectorType === 'id') {
    //     selector = "#" + data.selector;
    // }
    $(selector).animate({
        scrollTop : $(selector).offset().top
    })
}
