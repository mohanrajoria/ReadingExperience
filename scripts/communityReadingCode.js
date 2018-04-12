
var baseUrl = '',
__USER_INFO__ = {
                "user_id":"cd55a5354686480f9fc5e1a391da5384",
                "auth_token":"c3c4d62f6d6e41d1abf47c4f2a88479e",
                "role":"admin",
                "email_address":"durga@juggernaut.in"
            };

            if(__VIEW_TYPE__ === 'preview') {
                if(__BOOK_TYPE__ === 'community') {
                    // todo : this is to be done in future...
                } else if(__BOOK_TYPE__ === 'commissioned') {
                    $('.chapter-parent-container#commissioned').show();
                    getPreviewChaptersCommissioned(formatPreviewDetailsCommissioned);
                    // bindChapterContainerScrollEnd(scrollEndCallBack);
                    bindChapterContainerOnScroll(scrollingCallBack);
                }
            } else {
                if(__BOOK_TYPE__ === 'community') {
                    $('.chapter-parent-container#community').show();
                    getChaptersCommunity(__BOOK_ID__)
                } else if(__BOOK_TYPE__ === 'commissioned') {
                    $('.chapter-parent-container#commissioned').show();
                    getChaptersCommissioned(formatReadDetailsCommissioned);
                    bindChapterContainerScrollEnd(scrollEndCallBack);
                    bindChapterContainerOnScroll(scrollingCallBack);
                }
            }

/*
 xyzSegment = {
 "position": n,
 "element": DOMELEMENT
 }
 */
//for the time being
// This needs to be changed to the last read position
var lastSegment = null;
var currentSegment = {
	"position": 0,
	"element": $(".individualSection")[0]
};

$(document).ready(function() {
	//scrollPositionHandler = new ScrollPosition(document.querySelector('.main_container_h'));
});

$(document).on("click", ".new_read_TOC_h > li", function(e){
	//console.log($(this).attr("data-chapter-id"));
	scrollIntoView($(this).attr("data-chapter-id"));
})

function initiateInView(){
	// Binding the in-view of elements created
	// all the end leafs are bound here

	inView('.individualSection').on('enter', function(ele){
		lastSegment = currentSegment;
		currentSegment = {
			"position": $.inArray(ele, $(".individualSection")),
			"element": ele
		}
		if(currentSegment.position < lastSegment.position){
			scrollDirection = "up";
		}else{
			scrollDirection = "down";
		}
		// call the function to fetch data for the section
		// getDataForSegment($(ele).attr("id"));
		getDataForSegmentMultiple($(ele).attr("id"), bookId);
		updatePageNumber($(ele).attr("data-pageNo"));
	});
}

function initiateImageLoader(data){
	// return
	// console.log(data);
	if(data.length == 0){
		return;
	}

	var imgArray = [];
	$.each(data, function(i){
		imgArray.push({
			"document_id":data[i].value
		});
	});
	if(imgArray.length > 0){
		$.ajax({
			url: baseUrl + 'docs/',
			dataType: 'json',
			type: 'POST',
			contentType: "application/json; charset=utf-8",
			data: JSON.stringify({"document_list" : imgArray}),
			success: function( data){
				// console.log(data);
				populateImages(data);

			},
			error: function( jqXhr, textStatus, errorThrown ){
				//console.log( errorThrown );
			}
		});
	}
}

function populateImages(data){
	// console.log(data);
	if(data && data.data && (data.data.length > 0)){
		var ele;
		for(var i=0; i<data.data.length; i++){
			ele = $("img[data-image-id='"+data.data[i].id+"']");
			$(ele).attr('src', data.data[i].url);
			$(ele).css( 'content', 'url('+data.data[i].url+')' );
		}
	}

}

function getChaptersCommunity(book_id){
	scrollPositionHandler = new ScrollPosition(document.querySelector(_chapter_parent_container_selector_community_));
	bookId = book_id;

	sectionsCalled = {};
	scrollDirection;
	test = false;
	scrollPositionHandler;
	allSegmentsID.length = 0;
	lastSegment = null;
	currentSegment = {
		"position": 0,
		"element": $(".individualSection")[0]
	};

	var data = $.param({ field: ['skeleton', 'book_detail'] }, true);

	// var data = $.param({ field: ['skeleton', 'book_detail'] }, true);
	$.ajax({
		url: baseUrl + "books/"+bookId+'/read-meta/',
		headers: {
			'Authorization': 'Basic ' + __USER_INFO__.auth_token,
			'source': 'web'
		},
		contentType: 'application/json; charset=utf-8'
	}).done(function(data) {
		createSkeleton("community.chapter-parent-container", data.skeleton.skeleton_json);
		initiateInView();
		// TO DO
		// this has to be changed to the last read ID - NOTE
		if(data.last_read_loc.last_read_section){
			getDataForSegmentMultiple(data.last_read_loc.last_read_section, bookId);
		}else{
			getDataForSegmentMultiple(allSegmentsID[0], bookId);
		}

        screenOverlayHandler({action : 'hide', type : 'page-loading'});
	});
}

// function fetchSkeletonDataPreview(book_id){
// 	bookId = book_id;
// 	$.ajax({
// 		url: baseUrl +"books/"+bookId+'/preview-meta/',
// 		headers: {
// 			'Authorization': 'Basic ' + __USER_INFO__.auth_token,
// 			'source': 'web'
// 		},
// 		contentType: 'application/json; charset=utf-8'
// 		// data: data
// 	}).done(function(data) {
// 		console.log(data);
// 		createSkeleton("mainContainer", data.preview_skeleton.skeleton_json);
// 		initiateInView();
// 		// TO DO
// 		// this has to be changed to the last read ID - NOTE
// 		getDataForSegmentMultiple(allSegmentsID[0], bookId);
// 		// scrollIntoView(allSegmentsID[0]);
// 	});
// }

// function to scroll any div into the viewport
// parameter: ID of the div
function scrollIntoView(id){
	document.getElementById(id).scrollIntoView();
}
function updatePageNumber(page){
	$("#current-first-visible-page-number")[0].innerHTML = page;
}

function getDataForSegmentMultiple(id, book_id){
	bookId = book_id;
	var sectionIDS = [];
	var currentIDIndex = allSegmentsID.indexOf(id);
	var startID = (currentIDIndex<=5)?0:currentIDIndex;
	var segmentIDsForCall = allSegmentsID.slice(startID, startID+15);
	for(var i=0; i<segmentIDsForCall.length; i++){
		if((!sectionsCalled.hasOwnProperty(segmentIDsForCall[i])) && (sectionsCalled[segmentIDsForCall[i]] === undefined)){
			sectionIDS.push(segmentIDsForCall[i]);
		}
	}
	if(sectionIDS.length > 0){
		if(scrollDirection === "up"){
			scrollPositionHandler.prepareFor("up");
		}
		// do the ajax for the section with the ID here
		// on success add the element id to the object

		for(var j=0; j<sectionIDS.length; j++){
			sectionsCalled[sectionIDS[j]] = true;
		}

		var data = $.param({ section_id: sectionIDS }, true);
		$.ajax({
			url: baseUrl +'books/'+bookId+'/sections/',
			contentType: '"application/json; charset=utf-8"',
			headers: {
				'Authorization': 'Basic ' + __USER_INFO__.auth_token,
				'source': 'web'
			},
			data: data
		}).done(function(response) {
			populateDataMultiple(response);
			initiateImageLoader(response.assets);
		});
	}
}

function populateDataMultiple(response){

	for(var i=0; i<response.sections.length; i++){
		if(scrollDirection === "up"){
			scrollPositionHandler.prepareFor("up");
		}
		// try{
		//     $("#"+response.sections[i].section_id).html(response.sections[i].html).addClass("loaded");
		// }catch(er){
		var ele = document.getElementById(response.sections[i].section_id);
		// $(ele).html(response.sections[i].html).addClass("loaded");
		if(ele){
			ele.innerHTML = response.sections[i].html;
		}

		// }

		if(scrollDirection === "up"){
			scrollPositionHandler.restore();
		}
		// debugger
		if($("#"+response.sections[i].section_id).hasClass('stretchImage')){
			//console.log("has image")
			//console.log($("#"+response.sections[i].section_id).find('stretchImage').attr('img-id'));
		}
	}
}

/*
 Function ScrollPosition to maintain the position of the scroll when a content is loaded on the top
 ==================================================================================================
 */
function ScrollPosition(node) {
	this.node = node;
	this.previousScrollHeightMinusTop = 0;
	this.readyFor = 'up';
}

ScrollPosition.prototype.restore = function () {
	if (this.readyFor === 'up') {
		// this.node.scrollTop = this.node.scrollHeight - this.previousScrollHeightMinusTop;
		window.scrollBy(0, (this.node.scrollHeight - this.previousScrollHeightMinusTop));
	}

	// 'down' doesn't need to be special cased unless the
	// content was flowing upwards, which would only happen
	// if the container is position: absolute, bottom: 0 for
	// a Facebook messages effect
}

ScrollPosition.prototype.prepareFor = function (direction) {
	this.readyFor = direction || 'up';
	this.previousScrollHeightMinusTop = this.node.scrollHeight - this.node.scrollTop;
}

/*
 Function to create the HTML structure with the JSON
 ===================================================
 */
function createSkeleton(containerID, data){
	// container element
	var tocCount = 1;
	var container = $("#"+containerID);
	var currentChild, currentChildID, sectionDiv, placeholderDiv;
	for(var i=0; i<data.order.length; i++){

		currentChild = data.children[data.order[i]];

		currentChildID = data.children[data.order[i]].section_id;

		// create the first order of div
		sectionDiv = $("<div>").attr({
			id: currentChildID
		}).appendTo(container);




		if((!$.isEmptyObject(currentChild.children))&&(currentChild.order.length > 0)){
			$(sectionDiv).addClass("sectionBunch");
			createSkeleton(currentChildID, currentChild);

		}else{
			placeholderDiv = $("<div>").attr({
				class: 'individualPlaceholder'
				// id: currentChildID + i
			});
			$(sectionDiv).addClass("individualSection");
			// debugger
			$(sectionDiv).attr('data-pageNo', data.children[data.order[i]].meta.page_num);
			placeholderDiv.appendTo(sectionDiv);
			allSegmentsID.push(currentChildID);

            /**

			if(currentChild.meta.tocHeading){
				$(".new_read_TOC_h").append("<li "+"data-chapter-id="+currentChildID+">"+tocCount + ". " +currentChild.meta.tocHeading+"</li>");
				tocCount++;
				// console.log("heading = "+ currentChild.meta.tocHeading);
				// console.log("section ID = "+currentChildID);
			}
            */
		}
	}
}

function checkAndCreateTOC(){

}
// TODO : change to binary search

function findFirstSectionInView(){
	// var diff;
	var topSection;
	// debugger
	//console.log(allSegmentsID);
	var windowTop = Math.max($('body').scrollTop(), $('html').scrollTop());
	for(var i=0; i<allSegmentsID.length; i++){
		if($('#'+allSegmentsID[i]).hasClass("loaded")){
			if($('#'+allSegmentsID[i]).position().top >= windowTop){
				topSection = allSegmentsID[i];
				// topSection = $('#'+allSegmentsID[i]);
				break;
			}
		}
	}
	return topSection;
	// console.log(topSection);
}
