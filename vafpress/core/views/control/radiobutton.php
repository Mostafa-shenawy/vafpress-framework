<?php echo VP_View::instance()->load('control/template_control_head', $head_info); ?>

<?php foreach ($items as $item): ?>
<label>
	<input <?php if($item->value == $value) echo 'checked class="checked"'; ?> type="radio" name="<?php echo $name; ?>" value="<?php echo $item->value; ?>" />
	<span></span><?php echo $item->label; ?>
</label>
<?php endforeach; ?>

<?php echo VP_View::instance()->load('control/template_control_foot'); ?>