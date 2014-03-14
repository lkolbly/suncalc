$(function() {
    function add() {
	var hour_picker = "<select id='hourpicker-"+num_days+"'>";
	hour_picker += "<option value='-1'>Solar Noon</option>";
	for (var i=6; i<=18; i++) {
	    hour_picker += "<option value='"+i+"'>"+i+"</option>";
	}
	hour_picker += "</select>";
	var s = "<tr id='row-"+num_days+"'><td><input type='text' id='datepicker-"+num_days+"' value='04/28/2014'/></td><td>"+hour_picker+":00</td><td><input type='text' id='customtext-"+num_days+"'/></td><td><button id='delete-"+num_days+"'>Remove</button></td></tr>";
	var v = num_days;
	$("#days").append(s);
	$("#datepicker-"+num_days).datepicker();
	$("#delete-"+num_days).click(function() {
	    $("#row-"+v).remove();
	    deletion_record[v] = true;
	});
	deletion_record.push(false);
	num_days++;
    }

    var num_days = 0;
    var deletion_record = [];
    $("#add-day").click(function(e) {
	add();
    });
    add();

    $("#clear").click(function(e) {
	$("#days").html("");
	num_days = 0;
    });

    $("#submit").click(function(e) {
	var dates = [];
	for (var i=0; i<num_days; i++) {
	    if (!deletion_record[i]) {
		var date = {};
		var raw = $("#datepicker-"+i).val();
		var parts = raw.split("/");
		date.month = parseInt(parts[0])-1;
		date.day = parseInt(parts[1]);
		date.year = parseInt(parts[2]);
		date.hour = parseInt($("#hourpicker-"+i).val());
		date.customText = $("#customtext-"+i).val();
		dates.push(date);
	    }
	}
	console.log(dates);
	$("#result").html("Loading..... Please wait");
	$.ajax({
	    url: "genpdf",
	    method: "POST",
	    dataType: "json",
	    data: {data: dates},
	    error: function(jqXHR, textStatus, errorThrown) {
		console.log("error");
		console.log(errorThrown);
		$("#result").html("<span style='color:red'>An error occurred! Please try again....</span>");
	    },
	    success: function(data) {
		console.log("Success");
		var url = "getpdf/"+data.id;
		$("#result").html("<a target='_blank' href='"+url+"'>View your results</a>");
	    }
	});
    });
});
