/*
# MantisBT - a php based bugtracking system

# MantisBT is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 2 of the License, or
# (at your option) any later version.
#
# MantisBT is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License
# along with MantisBT.  If not, see <http://www.gnu.org/licenses/>.

# @author InitOS GmbH & Co.KG
#  @author Paul Götze <paul.goetze@initos.com>
*/

//var baseURI = $('head base').attr('href').replace('%2F', '/');//jQuery('script').context.baseURI;
//var baseURI = '/plugin.php?page=Dashboard/dashboard';
var pathArray = window.location.href.split( '/' );
var protocol = pathArray[0];
var host = pathArray[2];
var baseURI = protocol + '//' + host + '/plugin.php?page=Dashboard/dashboard';
var regex = /[^\/]+\/?$/;
var fileURI = baseURI.replace(regex, '');

var customBoxScript = fileURI + 'custom_box.php';
var defaultBoxScript = fileURI + 'default_box.php';

var mainPageLink = 'main_page.php';
var myViewPageLink = 'my_view_page.php';

var mainDialogWidth = 600;
var mainDialogHeight = 330;
var confirmDialogWidth = 300;
var confirmDialogHeigth = 200;

// Force redirects from my_view_page and main_page to Dashboard
window.onload = function(){ 
	url = '/plugin.php?page=Dashboard/dashboard';
	pathname = jQuery(location).attr('pathname');
	
	if (pathname.search(mainPageLink) > -1 || pathname.search(myViewPageLink) > -1) {
		window.location.replace(url);
	}
};

// Remove menu items 'My View' and 'Main Page' 
function removeMenuItems() {
	menu = jQuery('.menu').first();
	menuLinks = menu.find('a');
	
	filteredLinks = jQuery.grep(menuLinks, function( e, i ) {
		href = jQuery(e).attr('href');
		return href != '/' + mainPageLink && href != '/' + myViewPageLink;
	});
	
	menu.empty();
	menu.append(filteredLinks);
	menu.find('a:not(:first)').before(' | ');
};

// sets or removes a placeholder if column is (not aynmore) empty
function setColumnPlaceholder() {	
	jQuery("#dashboard-sortable-col1, #dashboard-sortable-col2, #dashboard-sortable-col3").each(
		function(index, element){
			var container = jQuery(element);
			var count = jQuery.grep(container.find('li'), function(e, i){
				display = jQuery(e).css('display');
				return  display != 'none' && display != "";
			}).length;
			
			if (count == 0) {
				if (container.find('.dashboard-column-placeholder').length == 0) {
					placeholder = "<div class='dashboard-column-placeholder'><span>"
						+ pluginLangGet['column_placeholder'] 
						+ "</span></div>";
					
					container.append(placeholder);
				}
			} else {
				container.find('.dashboard-column-placeholder').remove();
			}
	});
};

//re-print bug box
function setProjectFilter(data) {
	var boxId = data['box_id'];
	var projectId = data['project_id'];
	
	var html = data['html'];
	var projectsHtml = html['projects'];
	var counterHtml = html['counter'];
	
	var boxElementId ="#dashboard-box-" + boxId;
	
	jQuery(boxElementId).find("tr:gt(0)").remove();
	jQuery(boxElementId +' tr:first').after(projectsHtml);
	jQuery('#description-box-' + boxId).html(counterHtml);
};

function saveBoxVisibility(form) {
	var actionUrl = (customBoxesEnabled ? customBoxScript : defaultBoxScript);
	var boxId = form.children('input[name=box_id]').val();
	var visible = form.children('input[name=visible]').val();
	var dataValues = {
			box_id : boxId,
			visible:  visible,
			action: 'visibility'
			};
	
	handleAJAXCall(actionUrl, dataValues, setBoxVisibility, handleBoxVisibilityError);
}

function setBoxVisibility(data) {
	var boxId = data['box_id'];
	var visible = data['visible'];
	var linkHtml = data['link_show_html'];
	var boxElementId = '#dashboard-list-item-' + boxId;
	var listItemElementId = '#visibility-list-item-' + boxId;

	if(visible) {
		jQuery(boxElementId).fadeIn();
		jQuery(listItemElementId).remove();
		
		if(jQuery('.visibility-list-item').size() == 0 ) {
			jQuery('#dashboard-visibility-list-container').append(emptyVisibilityListText);
		}
	} else {
		jQuery(boxElementId).fadeOut(function(){
			setColumnPlaceholder();
		});
		
		jQuery('.visibility-list-item-filler').remove();
		jQuery('#dashboard-visibility-list-container').append(linkHtml);
	}

	setColumnPlaceholder();
};

function createCustomBox() {
	var boxTitle = jQuery("#create-box-title").val();
	var boxFilterId = jQuery("#dashboard-new-box-dialog select[name=create-custom-filter-select]").val();
	var issuesCount = jQuery("#create-box-issues-count").val();	
	
	console.log(issuesCount);
	
	var actionUrl = customBoxScript;
	var dataValues = { 
			title : boxTitle,
			filter_id: boxFilterId,
			issues_count: issuesCount,
			action: 'create'
			};
		
	handleAJAXCall(actionUrl, dataValues, afterCreateCustomBox, handleCreateCustomBoxError);
};

function editCustomBox() {
	var boxTitle = jQuery("#edit-box-title").val();
	var boxFilterId = jQuery("#dashboard-edit-box-dialog select[name=edit-custom-filter-select]").val();
	
	var visible = jQuery("#edit-box-visible-checkbox").prop('checked') ? 1 : 0;	
	var boxId = jQuery("#delete-box-link input[name=box_id]").val();
	var issuesCount = jQuery("#edit-box-issues-count").val();
		
	var actionUrl = customBoxScript;
	var dataValues = { title : boxTitle,
					   filter_id: boxFilterId,
					   visible: visible,
					   box_id: boxId,
					   issues_count: issuesCount,
					   action: 'edit'
					   };
		
	handleAJAXCall(actionUrl, dataValues, afterEditCustomBox, handleCreateCustomBoxError);
};

//call back function after  box creation
function afterCreateCustomBox(data){
	if(data["saved"] == true) {
		elementId = "dashboard-list-item-" + data["box_id"];
		listItem = '<li id="' + elementId +'">' + data["html"] + "</li>";
		jQuery("#dashboard-sortable-col1").prepend(listItem);
		saveCustomBoxPositions();
	} else {
		jQuery("#error-dialog").html(data["html"]).dialog("open");
	}
	
	setColumnPlaceholder();
	
	// clear fields in dialog for next creation:
	jQuery("#dashboard-new-box-dialog input[name=box-title]").val("");
	jQuery("#dashboard-new-box-dialog select[name=create-custom-filter-select] option:eq(0)").attr("selected", "selected");
	
	var input = jQuery("#create-box-issues-count");
	input.val(input.attr('max'));
};

//call back function after  box editing
function afterEditCustomBox(data) {	
	var boxId = data["box_id"];
	var linkHtml = data["link_show_html"];
	var visible = data["visible"];
	var html = data["html"];
	
	jQuery("#dashboard-custom-box-" + boxId).replaceWith(html);
	
	if(!visible) {
		var boxElementId = '#dashboard-custom-box-' + boxId;
		jQuery(boxElementId).parent("li").fadeOut(function() {
			setColumnPlaceholder();
		});
		jQuery('.visibility-list-item-filler').remove();
		jQuery('#dashboard-visibility-list-container').append(linkHtml);
	}
};

// save all custom boxes poistions
function saveCustomBoxPositions() {
	var forms = jQuery('.drag-box');
	var positionString = "";
	
	for(var i = 0; i < forms.length; i++) {
		var form = jQuery(forms[i]);
		var boxId = form.children('input[name=box_id]').val();
		var boxName = form.children('input[name=box_name]').val();
		var column = form.closest(".connectedSortable").data('column');
		
		var seperator = (i == forms.length - 1) ? "" : ",";
		positionString += escape(boxName) + ":" + boxId + ":" + column + seperator;
	}			
				
	var actionUrl = customBoxScript;
	var dataValues = { box_positions : positionString,
						action: 'position'
					};
					   
	handleAJAXCall(actionUrl, dataValues, afterSaveCustomBoxPositions , handleBoxPositionError);
};

// call back function after saving boxes position
function afterSaveCustomBoxPositions(data) {
	setColumnPlaceholder();
}

function deleteCustomBox(data) {		
	var boxId = jQuery("#delete-box-link input[name=box_id]").val();
	var actionUrl = customBoxScript;
	var dataValues = { 
			box_id: boxId,
			action: 'delete'
			};
		
	handleAJAXCall(actionUrl, dataValues, afterDeleteCustomBox, handleCreateCustomBoxError);
};

//call back function after box deleting
function afterDeleteCustomBox(data) {
	jQuery("#dashboard-custom-box-" + data["box_id"]).parent("li").remove();
	saveCustomBoxPositions();
};


//error handling functions
//=====================================================
//TODO: implement some usefull information!

function handleProjectFilterError() {
	//console.log("handleProjectFilterError");
};

function handleBoxVisibilityError() {
	//console.log("handleBoxVisibilityError");
};

function handleBoxPositionError() {
	//console.log("handleBoxPositionError");
};

function handleCreateCustomBoxError() {
	//console.log("handleCreateCustomBoxError");
};
//======================================================


function handleAJAXCall(actionUrl, dataValues, successFunction, errorHandlingFunction) {	
	jQuery.ajax({
		type : 'POST',
		url : actionUrl,
		dataType : 'json',
		data : dataValues,
		success : function(data) {
			successFunction(data);
		},
		error : function(XMLHttpRequest, textStatus, errorThrown) {
			errorHandlingFunction();
			console.log(XMLHttpRequest + " - " + textStatus + ", Error: "  + errorThrown);
		}
	});
};

jQuery(document).ready(function() {

	removeMenuItems();
	
	setColumnPlaceholder();
	
	var newBoxButtons =  {};
	var editBoxButtons = {};
	var confirmBoxButtons = {};
	
	function close() {
		jQuery(this).dialog("close");
	};
	
	function create(){
		createCustomBox();
		jQuery(this).dialog("close");
	};
	
	function edit(){
		editCustomBox();
		jQuery(this).dialog("close");
	};
	
	newBoxButtons[pluginLangGet['save_box']] = create;
	newBoxButtons[pluginLangGet['cancel']] = close;
	
	editBoxButtons[pluginLangGet['save_box']] = edit;
	editBoxButtons[pluginLangGet['cancel']] = close;
	
	confirmBoxButtons[pluginLangGet['cancel']] = close;
	confirmBoxButtons[pluginLangGet['delete_box']] = function() {
		deleteCustomBox();
		jQuery(this).dialog("close");
		jQuery("#dashboard-edit-box-dialog").dialog("close");
	};
	
	jQuery("#dashboard-new-box-dialog").dialog({
		autoOpen: false,
		height: 270,
		width: mainDialogWidth,
		modal: true,
		close: function() {
      		//allFields.val("").removeClass("ui-state-error");
    	},
    	open: function () {
    		var boxName = pluginLangGet['untitled'];
            jQuery(this).find('#create-box-title').val(boxName).select();
        },
    	buttons: newBoxButtons
	});
	
	// edit dialog for custom boxes
	jQuery("#dashboard-edit-box-dialog").dialog({
		autoOpen: false,
		height: mainDialogHeight,
		width: mainDialogWidth,
		modal: true,
		close: function() {},
    	buttons: editBoxButtons
	});
	
	// confirmation dialog
	jQuery("#dialog-confirm").dialog({
		autoOpen: false,
	  	resizable: false,
	  	height:confirmDialogHeigth,
	  	width: confirmDialogWidth,
	  	modal: true,
	  	buttons: confirmBoxButtons
	});
  
	//info dialog
	jQuery("#info-dialog").dialog({
		autoOpen: false,
		height: mainDialogHeight,
		width: mainDialogWidth,
		modal: false,
		buttons: {
	    "OK": function() {
	      	jQuery(this).dialog("close");
	   		}
		}
	});
		
	//error dialog
	jQuery("#error-dialog").dialog({
		autoOpen: false,
		height: mainDialogHeight,
		width: mainDialogWidth,
		modal: false,
		buttons: {
	    "OK": function() {
	    	jQuery(this).dialog("close");
	      	}
		}
	});
	
	//create box dialog	
	jQuery('select[name=source_query_id]').change(function () {
      var filterId = jQuery('select[name=create-custom-filter-select]').val();
      jQuery('select[name=create-custom-filter-select]').val(filterId);
      });
	
	jQuery("#create-box").click(function() {		
		jQuery("#dashboard-new-box-dialog").dialog("open");
		});
  
  // delete box
	jQuery(".dashboard-delete").click(function() {
		jQuery("#dialog-confirm").dialog("open");
		});
	
	//sortable
	jQuery('#dashboard-sortable-col1, #dashboard-sortable-col2, #dashboard-sortable-col3').sortable( {
		connectWith: '.connectedSortable',
		containment: "document",
		tolerance: 'pointer',
		handle: '.dashboard-drag',
		placeholder: 'dashboard-box-placeholder',
		stop: function() {
			saveCustomBoxPositions();
		},
		start: function(event, ui){
			ui.placeholder.height(ui.item.height());
		},
		change: function(){}
	}).disableSelection();
		
	//on select changed => sendajax request to update project filter 
	jQuery(document).on('change', 'select[name=project_id]', function() {
		var select = jQuery(this);
		var hiddenInput = select.parent('form').children('input[name=box_id]');
		
		if(hiddenInput.val()) {
			//show loader
			/*
			jQuery("#ajax_loader").ajaxStart(function() {
					jQuery(this).show(200);
				}).ajaxStop(function() {
					jQuery(this).hide();
			});
			*/
			
			var actionUrl = defaultBoxScript;
			var dataValues = { project_id : select.val(),
							   box_id: hiddenInput.val(),
							   action: 'filter'
							};
			
			handleAJAXCall(actionUrl, dataValues, setProjectFilter, handleProjectFilterError);
		}
	});
	
	
	//on hide clicked => hide box
	jQuery(document).on('click', 'form.hide-box', function() {
		saveBoxVisibility(jQuery(this));
	});
	
	//on show clicked => show box
	jQuery(document).on('click', 'form.show-box', function() {
		saveBoxVisibility(jQuery(this));
	});
	
	//on show custom box clicked => show custom box
	jQuery(document).on('click', 'form.show-custom-box', function() {
		saveBoxVisibility(jQuery(this));
	});
	
	//on edit clicked => open custom box edit dialog with certain values
	jQuery(document).on('click', 'form.edit-box', function() {
		var form = jQuery(this);
		var boxId = form.children('input[name=box_id]').val();
		var boxTitle = form.children('input[name=orig_box_title]').val();
		var boxFilterId= form.children('input[name=orig_box_filter_id]').val();
		var issuesCount = form.children('input[name=orig_issues_count]').val();
		
		jQuery("#delete-box-link input[name=box_id]").val(boxId);
		jQuery("#edit-box-title").val(boxTitle);
		jQuery("#edit-custom-filter-select option[value=" + boxFilterId + "]").attr("selected", "selected");
		jQuery("#edit-box-visible-checkbox").prop("checked", true);
		jQuery("#edit-box-issues-count").val(issuesCount);	
		
		jQuery("#dashboard-edit-box-dialog").dialog("open");
	});
});
