;(function($) {
	// jQuery hacks
	var _addClass = $.fn.addClass;
	$.fn.addClass = function() {
		var result = _addClass.apply( this, arguments );
		if (this.prop('tagName') == 'BODY' && arguments[0] == 'folded') { calculatePositionAndSize(); }
		return result;
	};
	var _removeClass = $.fn.removeClass;
	$.fn.removeClass = function() {
		var result = _removeClass.apply( this, arguments );
		if (this.prop('tagName') == 'BODY' && arguments[0] == 'folded') { calculatePositionAndSize(); }
		return result;
	};

	var is_ie      = $.browser.msie;
	var ie_version = 0;

	if(is_ie)
	{
		ie_version = jQuery.browser.version;
		ie_version = parseFloat(ie_version);
	}

	// custom checkbox and radiobutton event binding
	vp.custom_check_radio_event(".vp-wrap", ".vp-field.vp-checked-field .field .input label");

	// init select2
	if ($.fn.select2) $('.vp-js-select2').select2({allowClear: true, placeholder: "Select option(s)"});
	if ($.fn.select2Sortable) $('.vp-js-sorter').select2().select2Sortable();

	/* BEGIN FETCHING ALL FIELDS' VALIDATION and BINDING RULES */
	var validation   = [];
	var bindings     = [];
	var dependencies = [];
	var dep;
	$('.vp-menu-goto').each(function(i) {
		var href = $(this).attr('href'),
		    $panel = $(href),
		    fields = [];

		$panel.children('.vp-field').each(function(j) {
			var $field = $(this),
				name   = $field.attr('id'),
				rules  = $field.attr('data-vp-validation'),
				bind   = $field.attr('data-vp-bind'),
				type   = $field.getDatas().type,
				$input = $('[name="' + name + '"]');

			dep = $field.attr('data-vp-dependency');

			dep   && dependencies.push({dep: dep, type: 'field', source: $field.attr('id')});
			bind  && bindings.push({bind: bind, type: type, source: name});
			rules && fields.push({name: name, rules: rules, type: type});
		});

		$panel.children('.vp-section').each(function(i) {
			var $section = $(this);

			dep = $section.attr('data-vp-dependency');
			dep && dependencies.push({dep: dep, type: 'section', source: $section.attr('id')});

			$section.find('.vp-field').each(function(j) {
				var $field = $(this),
					name   = $field.attr('id'),
					rules  = $field.attr('data-vp-validation'),
					bind   = $field.attr('data-vp-bind'),
					type   = $field.getDatas().type,
					$input = $('[name="' + name + '"]');

				dep = $field.attr('data-vp-dependency');

				dep   && dependencies.push({dep: dep, type: 'field', source: $field.attr('id')});
				bind  && bindings.push({bind: bind, type: type, source: name});
				rules && fields.push({name: name, rules: rules, type: type});
			});
		});

		if (fields.length > 0) validation.push({ name: href.trimChar('#'), fields: fields });
	});
	/* END FETCHING ALL FIELDS' VALIDATION and BINDING RULES */

	// get and click current hash
	$('.vp-js-menu-goto').click(function(e) {
		e.preventDefault();
		window.location.hash = $(this).attr('href');
		var $this     = $(this),
		    $li       = $this.parent('li'),
		    $parent   = $li.parents('li'),
		    $siblings = $li.siblings('li'),
		    $parent_siblings = $parent.siblings('li'),
		    $panel    = $($this.attr('href'));
		$siblings.removeClass('vp-current');
		$parent_siblings.removeClass('vp-current');
		$parent.addClass('vp-current');
		$li.addClass('vp-current');
		$panel.siblings('.vp-panel').removeClass('vp-current');
		$panel.addClass('vp-current');
	});

	// goto current menu
	var hash = window.location.hash;
	if (hash !== '')
	{
		$('a[href="' + hash + '"]').trigger('click');
	}
	else
	{
		$('.vp-current > .vp-js-menu-goto').click();
	}

	$('.vp-js-menu-dropdown').click(function(e) {
		e.preventDefault();
		var $this = $(this),
		    $parent = $this.parent('li'),
		    $li = $parent.siblings('li'),
		    $sub = $this.next('ul');
		if ($parent.hasClass('vp-current')) return;
		$li.removeClass('vp-current');
		$parent.addClass('vp-current');
		if($sub.children('li.vp-current').exists())
			$sub.children('li.vp-current').children('a').click();
		else
			$sub.children('li').first().children('a').click();
	});

	// Bindings
	for (var i = 0; i < bindings.length; i++)
	{
		var field = bindings[i],
		    temp  = field.bind.split('|'),
		    func  = temp[0],
		    dest  = temp[1],
		    ids   = [];

		dest = dest.split(',');

		for (var j = 0; j < dest.length; j++)
		{
			ids.push(dest[j]);
		}

		for (var j = 0; j < ids.length; j++)
		{
			vp.binding_event(ids, j, field, func, '.vp-wrap', 'option');
		}
	}
	/* ============================================================ */

	// DEPENDENCY
	for (var i = 0; i < dependencies.length; i++)
	{
		var field = dependencies[i],
		    temp  = field.dep.split('|'),
		    func  = temp[0],
		    dest  = temp[1],
		    ids   = [];

		dest = dest.split(',');

		for (var j = 0; j < dest.length; j++)
		{
			ids.push(dest[j]);
		}

		for (var j = 0; j < ids.length; j++)
		{
			vp.dependency_event(ids, j, field, func, '.vp-wrap');
		}
	}

	// Ajax Saving
	$('.vp-js-option-form').bind('submit', function(e) {
		e.preventDefault();

		$('.vp-js-option-form .vp-field').removeClass('vp-error');
		$('.validation-notif.vp-error').remove();
		$('.validation-msg.vp-error').remove();

		var allError = 0,
		    menuNotifHTML = '<em class="validation-notif vp-error"></em>';

		for (var i=0; i<validation.length; i++)
		{
			var panel = validation[i];

			panel.nError = 0;
			panel.nError = vp.fields_validation_loop(panel.fields);

			if (panel.nError > 0)
			{
				// notify the menu which has the href
				var $notif  = $(menuNotifHTML),
				    $anchor = $('[href="#' + panel.name +'"]'),
				    $grandparent = $anchor.parent('li').parent('ul');
				$notif.appendTo($anchor);
				if ($grandparent.hasClass('vp-menu-level-2'))
				{
					if ($grandparent.siblings('a').children('.validation-notif.vp-error').length === 0)
					{
						$notif.clone().appendTo($grandparent.siblings('a'));
					}
				}
			}
			allError = allError + panel.nError;
		}

		// do not saving it any error occurs
		if (allError > 0) { return; }

		// otherwise, do saving
		var $loading = $('.vp-js-save-loader'),
			$button = $(this),
			$save_status = $('.vp-js-save-status'),
			$form = $('#vp-option-form'),
			option = $form.serializeArray(),
			data = {
				action: 'vp_ajax_save',
				option: option,
				nonce : vp_opt.nonce
			};

		$button.attr('disabled', 'disabled');
		$loading.stop(true, true).fadeIn(100);

		$.post(ajaxurl, data, function(response) {
			$save_status.html(response.message);
			if (response.status)
			{
				$save_status.addClass('success');
			}
			else
			{
				$save_status.addClass('failed');
			}
			$loading.stop(true, true).fadeOut(100, function() {
				$save_status.stop(true, true).fadeIn(100);
			});

			setTimeout(function() {
				$button.removeAttr('disabled');
				$save_status.stop(true, true).fadeOut(1000, function() {
					$save_status.removeClass('success').removeClass('failed');
				});
			}, 3000);
		}, 'JSON');

	});

	$('#vp-js-import').bind('click', function(e) {
		e.preventDefault();

		var $textarea      = $('#vp-js-import_text'),
		    $import_status = $('#vp-js-import-status'),
		    $import_loader = $('#vp-js-import-loader'),
		    $button        = $(this);
		    data           = {action: 'vp_ajax_import_option', option: $textarea.val(), nonce : vp_opt.nonce};

		$button.attr('disabled', 'disabled');
		$import_loader.fadeIn(100);

		$.post(ajaxurl, data, function(response) {
			$import_loader.fadeOut(0);
			if (response.status)
			{
				$import_status.html(vp_opt.impexp_msg.import_success);
			}
			else
			{
				$import_status.html(vp_opt.impexp_msg.import_failed + ': ' + response.message);
			}
			$import_status.fadeIn(100);
			setTimeout(function() {
				$import_status.fadeOut(1000, function() {
					$button.removeAttr('disabled');
					$import_status.fadeOut(500);
					if (response.status)
						location.reload();
				});
			}, 2000);
		}, 'JSON');
	});

	$('#vp-js-export').bind('click', function(e) {
		e.preventDefault();

		var $export_status = $('#vp-js-export-status'),
		    $export_loader = $('#vp-js-export-loader'),
		    $button        = $(this);
		    data           = {action: 'vp_ajax_export_option', nonce : vp_opt.nonce},

		$button.attr('disabled', 'disabled');
		$export_loader.fadeIn(100);
		$.post(ajaxurl, data, function(response) {
			$export_loader.fadeOut(0);
			if (!$.isEmptyObject(response.option) && response.status)
			{
				$('#vp-js-export_text').val(response.option);
				$export_status.html(vp_opt.impexp_msg.export_success);
			}
			else
			{
				$export_status.html(vp_opt.impexp_msg.export_failed + ': ' + response.message);
			}
			$export_status.fadeIn(100);
			setTimeout(function() {
				$export_status.fadeOut(1000, function() {
					$button.removeAttr('disabled');
					$export_status.fadeOut(500);
				});
			}, 3000);
		}, 'JSON');
	});


}(jQuery));