$(function() {
    function add(date, hour, customtext) {
	date = date||"04/28/1995";
	customtext = customtext||"";
	var hour_picker = "<select id='hourpicker-"+num_days+"'>";
	hour_picker += "<option value='-1'>Solar Noon</option>";
	for (var i=6; i<=18; i++) {
	    if (hour === i) {
		hour_picker += "<option value='"+i+"' selected>"+i+"</option>";
	    } else {
		hour_picker += "<option value='"+i+"'>"+i+"</option>";
	    }
	}
	hour_picker += "</select>";
	var s = "<tr id='row-"+num_days+"'><td><input type='text' id='datepicker-"+num_days+"' value='"+date+"'/></td><td>"+hour_picker+":00</td><td><input type='text' id='customtext-"+num_days+"' value='"+customtext.replace("'", "&#39;")+"'/></td><td><button id='delete-"+num_days+"'>Remove</button></td></tr>";
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

    $("#example-calenders").click(function(e) {
	$("#days").html("");
	num_days = 0;
	deletion_record = [];

	if ($("#example-calenders").val() === "months") {
	    add("01/01/2014", 12);
	    add("02/01/2014", 12);
	    add("03/01/2014", 12);
	    add("04/01/2014", 12);
	    add("05/01/2014", 12);
	    add("06/01/2014", 12);
	    add("07/01/2014", 12);
	    add("08/01/2014", 12);
	    add("09/01/2014", 12);
	    add("10/01/2014", 12);
	    add("11/01/2014", 12);
	    add("12/01/2014", 12);
	} else if ($("#example-calenders").val() === "holidays") {
	    add("01/01/2014", 12, "Noon on New Year's");
	    add("02/14/2014", 12, "Noon on Valentine's");
	    add("05/05/2014", 12, "Noon on Cinco de Mayo");
	    add("07/04/2014", 12, "Noon on July 4th");
	    add("10/31/2014", 12, "Noon on Halloween");
	    add("12/25/2014", 12, "Noon on Christmas");
	} else {
	    add("04/28/1995");
	}
    });

    $("#clear").click(function(e) {
	$("#days").html("");
	num_days = 0;
	deletion_record = [];
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
