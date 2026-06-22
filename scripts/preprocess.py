# -*- coding: utf-8 -*-
"""
食谱数据预处理脚本
读取 caipu_1.csv，清洗并结构化处理前 2000 条有效数据，
输出 SQLite 数据库 + 两个 JSON 文件。
"""
import os
import re
import json
import sqlite3
from collections import Counter

import pandas as pd

# ===== 路径配置 =====
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CSV_PATH = os.path.join(BASE_DIR, 'data', 'caipu_1.csv')
DB_PATH = os.path.join(BASE_DIR, 'data', 'recipes.db')
INGREDIENTS_JSON = os.path.join(BASE_DIR, 'data', 'ingredients_list.json')
CATEGORIES_JSON = os.path.join(BASE_DIR, 'data', 'categories_list.json')

# ===== 常量 =====
TARGET_ROWS = 2000
DIFFICULTY_MAP = {0: '初级', 1: '中级', 2: '中级', 3: '高级'}

# ===== 食材分类规则 =====
# 按优先级匹配，命中即归类；未命中归为"其他"
# 注意：调味料优先级最高，避免"烤肉料"、"蚝油"等被误归为肉类/海鲜
INGREDIENT_CATEGORIES = [
    # 1. 调味料（最高优先级，避免含"肉"/"鱼"/"虾"字的调料被误分类）
    ('调味料', [
        # 调味后缀词（含这些词的多为调料）
        '料', '酱', '醬', '汁', '豉油', '卤水', '卤汁', '老卤', '糟卤',
        # 基础调味
        '盐', '鹽', '糖', '酱油', '醬油', '生抽', '老抽', '料酒', '醋',
        '蚝油', '耗油', '蠔油', '鱼露', '虾油', '香油', '芝麻油',
        '橄榄油', '花生油', '菜籽油', '色拉油', '食用油', '植物油',
        '黄油', '猪油', '豬油', '牛油', '鸡油', '葵花籽油', '玉米油',
        '调和油', '辣椒油', '辣油', '花椒油', '蒜油', '葱油', '姜油',
        '孜然油', '藤椒油', '芥末油', '红油', '豆瓣油', '麻油', '香麻油',
        '麻辣油', '酥油', '老油', '烹调油', '食油', '豆油', '熟豆油',
        '稻米油', '山茶油', '茶油', '油辣子', '油泼辣子', '小油辣',
        '辣酱', '蒜蓉酱', '黄酱', '面酱', '酱料', '油渣',
        # 鲜味剂
        '味精', '鸡精', '鸡粉', '鸡汁', '鸡晶', '味素', '味极鲜', '味达美',
        '味增', '味噌', '美极鲜', '美味鲜', '鲜味汁', '蔬之鲜', '太太乐',
        '东古', '李锦记', '海天', '头抽', '牦油',
        # 酱类
        '豆瓣酱', '辣豆瓣', '四川豆瓣', '郫县豆瓣', '辣椒酱', '番茄酱',
        '番茄沙司', '芝麻酱', '花生酱', '甜面酱', '海鲜酱', '叉烧酱',
        '排骨酱', '柱候酱', 'xo酱', '老干妈', '牛肉酱', '瑶柱酱',
        '沙茶', '沙茶浆', '干沙茶',
        # 香料粉
        '咖喱', '咖哩', '五香粉', '十三香', '孜然', '花椒粉', '辣椒粉',
        '胡椒粉', '黑胡椒', '白胡椒', '花椒', '八角', '大料', '桂皮',
        '香叶', '桂叶', '草果', '丁香', '小茴香', '茴香', '回香',
        '陈皮', '陳皮', '甘草', '白蔻', '豆蔻', '砂仁', '良姜', '白芷',
        '山奈', '荜拨', '罗汉果', '椒盐', '蒜盐', '五香', '综合香料',
        '香料', '腌料', '腌肉料', '烤肉料', '烤肉酱', '烤肉粉', '烧烤汁',
        '烧烤粉', '奥尔良', '水煮鱼调料', '酸菜鱼调料', '香水鱼', '火锅料',
        '火锅底料', '浓汤宝', '炖肉料', '炖肉香料', '调料', '调味', '料包',
        '油炸粉', '蒸肉粉', '蒸肉米粉', '自制鲜辣粉', '肉桂', '肉桂粉',
        # 糖类
        '冰糖', '白糖', '白砂糖', '红糖', '黑糖', '绵白糖', '细砂糖',
        '蜂蜜', '麦芽糖', '糖浆', '枫糖浆', '玉米糖浆', '葡萄糖',
        # 盐类
        '食盐', '细盐', '粗盐', '海盐', '岩盐', '碘盐', '低钠盐',
        # 醋类
        '白醋', '陈醋', '香醋', '米醋', '苹果醋',
        # 汁/汤
        '柠檬汁', '青柠汁', '橙汁', '高汤', '清汤', '鸡汤', '骨汤',
        '上汤', '老汤', '红烧汁', '腐乳汁', '南乳汁', '玫瑰露', '肉汤',
        # 酒类
        '啤酒', '白酒', '黄酒', '米酒', '清酒', '红酒', '葡萄酒',
        '朗姆酒', '白兰地', '威士忌', '伏特加', '花雕', '绍兴酒',
        '绍酒', '老酒', '醪糟', '酒酿', '酒釀', '酒糟', '梅子酒',
        '双蒸酒', '玫瑰露酒', '上海老酒',
        # 烘焙添加剂
        '吉利丁', '明胶', '琼脂', '小苏打', '泡打粉', '酵母', '干酵母',
        '碱', '食粉', '塔塔粉', '吉士粉', '可可粉', '抹茶粉', '红曲粉',
        '南瓜粉', '酵母粉', '发酵粉', '臭粉', '硼砂', '食碱', '苏打粉',
        '菌粉', '香辣粉', '麻辣粉', '咖哩粉', '熟石膏粉',
        # 淀粉/勾芡
        '水淀粉', '生粉', '淀粉', '红薯粉', '土豆粉', '木薯粉', '澄粉',
        '茨粉', '芡粉', '玉米淀粉',
        # 腐乳/酱料
        '腐乳', '红方腐乳', '红腐乳', '南乳', '南乳汁',
        # 其他液体
        '清水', '凉白开', '水', '蛋液', '芥末', '奶油', '淡奶油',
        # 饮料
        '可乐', '芬达', '雪碧',
    ]),
    # 2. 蛋类（优先于肉类，避免"鸡蛋"被肉类的"鸡"匹配）
    ('蛋类', [
        '鸡蛋', '雞蛋', '鸭蛋', '鹅蛋', '鹌鹑蛋', '鸽蛋', '蛋黄', '蛋清',
        '蛋白', '皮蛋', '松花蛋', '咸蛋', '咸蛋黄', '咸蛋白', '蛋液体',
        '蛋液', '土鸡蛋', '全蛋', '宝宝蛋', '蛋',
    ]),
    # 3. 肉类（用精确词，避免单字"肉"匹配到"烤肉料"——但调味料已优先匹配）
    ('肉类', [
        '猪肉', '豬肉', '牛肉', '羊肉', '鸡肉', '雞肉', '鸭肉', '鴨肉',
        '鹅肉', '鵝肉', '驴肉', '兔肉', '兔腿', '狗肉',
        '五花肉', '三层肉', '里脊', '瘦肉', '精肉', '肥肉', '肉末', '肉未',
        '肉丝', '肉片', '肉丁', '肉块', '肉碎', '肉馅', '肉丸', '肉松',
        '肉皮', '肉泥', '肉沫', '肉糜', '肉滑', '肉蔻',
        '肉少许', '肉', '鲜肉', '熟肉', '红烧肉', '腌肉', '蜡肉', '腊肉',
        '排骨', '五花', '净排', '纤排', '子排', '牛腩', '牛排', '牛柳',
        '牛腱', '牛键子', '牛筋', '牛尾', '牛腓力', '牛仔骨', '牛蛙',
        '羊排', '羊蝎子', '羊肺', '羊腿肉', '羊后腿肉',
        '鸡腿', '鸡翅', '鸡胸', '鸡爪', '鸡胗', '鸡肝', '鸡心',
        '鸡块', '鸡丁', '鸡丝', '鸡柳', '鸡杂', '鸡架', '鸡根',
        '鸡中翅', '鸡中翼', '鸡全翅', '鸡尖', '鸡趐', '鸡脯肉',
        '翅中', '翅根', '凤爪', '鸡', '鸡1只',
        '整鸡', '全鸡', '土鸡', '童子鸡', '三黄鸡', '乌鸡', '老母鸡',
        '仔鸡', '竹丝鸡', '咸草鸡', '黑腿鸡', '鹌鹑', '鸽子', '乳鸽',
        '老鸽子', '油鸡',
        '猪肝', '猪心', '猪肚', '猪肠', '猪血', '猪皮', '猪头',
        '猪蹄', '猪脚', '猪手', '猪腰', '猪肺', '猪舌', '猪耳',
        '猪尾', '猪脆骨', '猪龙骨', '猪大肠', '猪小肠', '猪前蹄',
        '猪前腿肉', '猪后腿肉', '猪腿肉', '猪骨', '猪里肌', '猪白肉',
        '豬腳', '豬排', '大豬排', '前肘', '后肘', '蹄花', '脑花',
        '肥牛', '肥羊', '前腿肉', '后腿肉', '夹心肉', '夹心肉糜',
        '火腿', '香肠', '腊肠', '蜡肠', '广式腊肠', '培根', '叉烧',
        '烤肠', '肠仔', '亲亲肠', '肉肠', '酱肉', '酱猪肚', '午餐肉',
        '丸子', '香芋丸子', '骨头', '脊骨', '棒骨', '腔骨', '肋排',
        '小排', '大排', '筒子骨', '汤骨', '寸骨', '肋骨', '主料排骨',
        '烧腩肉', '油炸肉皮', '带皮猪白肉', '大喜大牛肉粉',
        # 鸭类
        '鸭', '鴨', '鸭子', '鸭腿', '鸭翅', '鸭胸肉', '鸭脚', '鸭血',
        '鸭下巴', '鸭边腿', '半片鸭', '半边鸭', '白条鸭', '无辜的鸭子',
        # 鸡蛋相关（蛋类会优先匹配，这里不冲突）
    ]),
    # 3. 海鲜水产（用精确词，避免"蚝油"/"蒸鱼豉油"被误分类——调味料已优先）
    ('海鲜水产', [
        '虾', '蟹', '鱼', '贝', '蛤', '牡蛎', '扇贝', '鲍鱼', '鱿鱼',
        '章鱼', '墨鱼', '带子', '海螺', '海蜇', '海带', '紫菜', '海苔',
        '裙带菜', '海兔子', '海兔头', '海参', '海裙子',
        '三文鱼', '金枪鱼', '鳕鱼', '鲈鱼', '鲫鱼', '鲤鱼', '草鱼',
        '鲢鱼', '黑鱼', '带鱼', '黄鱼', '鲳鱼', '鲅鱼', '马鲛鱼',
        '龙利鱼', '巴沙鱼', '银鱼', '泥鳅', '黄鳝', '鳝鱼', '甲鱼',
        '乌龟', '龙虾', '基围虾', '皮皮虾', '明虾', '河虾', '海虾',
        '虾仁', '虾米', '虾皮', '虾干', '乌贼', '小乌贼',
        '蟹肉', '蟹黄', '蟹棒', '鱼丸', '鱼豆腐', '鱼排', '鱼片',
        '鱼柳', '干贝', '瑶柱', '蛏子', '花甲', '蚬子', '青口',
        '淡菜', '海虹', '蛰头', '牛蛙',
    ]),
    # 4. 豆制品
    ('豆制品', [
        '豆腐', '豆干', '豆皮', '腐竹', '腐皮', '油豆腐', '豆腐皮',
        '豆腐干', '千张', '百叶', '素鸡', '素肉', '豆筋', '豆腐丝',
        '豆腐泡', '内酯豆腐', '嫩豆腐', '老豆腐', '北豆腐', '南豆腐',
        '魔芋', '纳豆', '豆豉', '豆鼓', '百页结', '香干', '豆沙',
        '豆子', '红豆', '绿豆', '芸豆', '眉豆', '赤小豆', '黄豆',
        '豆瓣', '豆粉', '虹豆', '油皮儿', '素几',
    ]),
    # 6. 蔬菜
    ('蔬菜', [
        '菜', '萝卜', '胡萝卜', '土豆', '洋葱', '蒜', '姜', '葱', '椒',
        '茄', '番茄', '西红柿', '黄瓜', '丝瓜', '冬瓜', '南瓜', '苦瓜',
        '西葫芦', '芹菜', '菠菜', '白菜', '青菜', '生菜', '油麦菜',
        '空心菜', '苋菜', '韭菜', '韭黄', '蒜苗', '蒜薹', '蒜黄',
        '豆苗', '豆芽', '绿豆芽', '黄豆芽', '香椿', '香菜', '茼蒿',
        '蒿子杆', '莴笋', '莴苣', '竹笋', '春笋', '冬笋', '笋干',
        '芦笋', '芦荟', '莲藕', '藕', '马蹄', '荸荠', '山药', '芋头',
        '红薯', '地瓜', '紫薯', '木薯', '百合', '玉米', '苞米', '豌豆',
        '青豆', '毛豆', '蚕豆', '扁豆', '四季豆', '豆角', '豇豆',
        '荷兰豆', '秋葵', '西兰花', '花菜', '菜花', '甘蓝', '包菜',
        '卷心菜', '圆白菜', '紫甘蓝', '芥蓝', '芥菜', '雪里蕻',
        '木耳', '银耳', '黑木耳', '蘑菇', '香菇', '金针菇', '杏鲍菇',
        '平菇', '草菇', '茶树菇', '蟹味菇', '白玉菇', '海鲜菇', '松茸',
        '口蘑', '鸡腿菇', '猴头菇', '花菇', '冬菇', '滑子菇', '秀珍菇',
        '鲜蘑', '磨菇', '真菌菇', '菌子', '菌菇', '青椒', '红椒', '黄椒',
        '辣椒', '尖椒', '小米椒', '米椒', '干辣椒', '青蒜', '青葱',
        '小葱', '大葱', '香葱', '蒜瓣', '蒜头', '蒜蓉', '蒜末', '蒜片',
        '姜丝', '姜片', '姜末', '葱段', '葱花', '葱白', '葱结', '葱姜',
        '葱姜蒜', '姜蒜', '水发木耳', '木耳菜', '娃娃菜', '小白菜',
        '大白菜', '青红椒', '红萝卜', '白萝卜', '水萝卜', '心里美',
        '茭白', '菱角', '苜蓿', '蕨菜', '酸笋', '嫩笋', '细笋', '小笋',
        '罗汉笋', '笋子', '笋', '芥兰', '芦蒿', '白蒿', '藠头',
        '藿香', '紫苏', '罗勒', '罗勒叶', '迷迭香', '百里香', '薄荷',
        '薄荷叶', '九层塔', '法香', '香茅', '香草', '香芹', '西芹',
        '西洋芹', '芫茜', '芫西', '芫须', '香莱', '菊花', '桂花',
        '洛神花', '玫瑰', '藏红花', '虫草花', '黄花', '黄花菜',
        '圣女果', '金瓜', '凉瓜', '夜开花', '大节瓜', '仙人掌',
        '上海青', '莲花白', '色拉都', '青瓜', '青笋', '青笋条',
        '西蓝花', '马铃薯', '番薯', '蔥', '薑', '蘿蔔', '洋蔥',
        '胡罗卜', '二荆条', '红辣子', '红辣角', '绿辣子', '糟辣子',
        '辣妹子', '青尖叫', '辣鲜露', '红99', '栗子', '牛蒡',
    ]),
    # 7. 主食面食
    ('主食面食', [
        '面粉', '面条', '面', '米饭', '糯米', '粳米', '籼米', '糙米',
        '黑米', '紫米', '小米', '大米', '大麦米', '菰米', '粟米',
        '泰国香米', '玉米面', '玉米粉', '低筋面粉', '高筋面粉', '中筋面粉',
        '面包糠', '面包', '馒头', '花卷', '包子', '饺子皮', '馄饨皮',
        '春卷皮', '粉丝', '粉条', '米粉', '米线', '河粉', '粿条',
        '年糕', '汤圆', '元宵', '燕麦', '燕麦片', '麦片', '荞麦',
        '藜麦', '高粱', '薏米', '薏仁', '西米', '通心粉', '意面',
        '螺旋粉', '挂面', '碱面', '鸡蛋面', '手擀面', '拉面', '乌冬面',
        '荞麦面', '小麦', '小麦粉', '吐司', '吐司片', '锅巴', '熟粽子',
        '粽子', '速冻饺子', '粉干', '拉皮', '绿豆拉皮', '绿豆粉皮',
        '卷粉皮', '蕨根粉', '凉粉卷', '焖子', '白粥', '粥', '隔夜饭',
        '冬粉', '沙拉', '油条', '剩油条',
    ]),
    # 8. 干果坚果
    ('干果坚果', [
        '花生', '核桃', '杏仁', '腰果', '榛子', '夏威夷果', '巴旦木',
        '开心果', '松子', '松仁', '瓜子', '葵花籽', '南瓜子', '西瓜子',
        '芝麻', '白芝麻', '黑芝麻', '亚麻籽', '奇亚籽', '莲子',
        '枸杞', '红枣', '大枣', '桂圆', '荔枝', '葡萄干', '蔓越莓',
        '蓝莓干', '芒果干', '菠萝干', '杏干', '梅干', '乌梅', '酸梅',
        '话梅', '果脯', '蜜饯', '椰蓉', '椰丝', '椰浆', '椰汁',
        '椰子', '椰浆粉', '椰奶', '白果', '银杏', '芡实', '茨实',
        '蜜枣', '密枣', '小枣', '新疆灰枣', '阿胶糕', '坚果',
        '乳扇', '奶酪', '芝士', '芝士片', '马苏里拉', '车达奶酪',
        '炼乳', '炼奶', '牛奶', '纯牛奶', '酸奶', '安慕希',
    ]),
    # 9. 水果
    ('水果', [
        '苹果', '梨', '香蕉', '橙子', '橘子', '柑橘', '柚子', '葡萄',
        '提子', '草莓', '蓝莓', '树莓', '黑莓', '西瓜', '哈密瓜',
        '甜瓜', '香瓜', '木瓜', '芒果', '菠萝', '榴莲', '火龙果',
        '猕猴桃', '奇异果', '桃子', '油桃', '李子', '杏', '樱桃',
        '车厘子', '石榴', '柿子', '山楂', '椰子', '牛油果',
        '柠檬', '青柠', '百香果', '释迦', '莲雾', '杨桃', '枇杷',
        '杨梅', '桑葚', '无花果', '青梅', '黄桃', '水蜜桃', '蟠桃',
        '圣女果', '小酸柑', '黑橄榄', '橄榄', '橙皮', '柚子皮',
        '鲜橘皮', '鲜粽叶', '粽叶', '稻草', '棉线', '棉绳', '牙签',
        '竹签', '签子', '竹丝',
    ]),
]


def classify_ingredient(name):
    """根据食材名分类，返回分类名"""
    if not name:
        return '其他'
    for category, keywords in INGREDIENT_CATEGORIES:
        for kw in keywords:
            if kw in name:
                return category
    return '其他'


# ===== 工具函数 =====
def split_hash(s):
    """按 # 分隔字段，返回清洗后的列表"""
    if s is None or (isinstance(s, float) and pd.isna(s)):
        return []
    return [item.strip() for item in str(s).split('#') if item.strip()]


def clean_ingredient_name(name):
    """清洗食材名：去括号、去前导数字标点"""
    if not name:
        return None
    # 去括号及内容（中英文括号）
    name = re.sub(r'[\(（].*?[\)）]', '', name)
    # 去前导数字和标点
    name = re.sub(r'^[\d\s.、，,]+', '', name)
    # 去全角/半角空格
    name = name.replace(' ', '').replace('　', '')
    name = name.strip()
    # 长度过滤 1~20
    if not (1 <= len(name) <= 20):
        return None
    return name


def detect_platform(url):
    """检测视频平台"""
    if url is None or (isinstance(url, float) and pd.isna(url)) or str(url).strip() == '':
        return None
    u = str(url).lower()
    if 'youku.com' in u:
        return 'youku'
    elif 'bilibili.com' in u or 'b23.tv' in u:
        return 'bilibili'
    elif 'tudou.com' in u:
        return 'tudou'
    elif 'iqiyi.com' in u or 'iqiyi' in u:
        return 'iqiyi'
    elif 'v.qq.com' in u:
        return 'tencent'
    else:
        return 'other'


def normalize_cost_time(s):
    """耗时归一化为分档：15分钟以内/30分钟/1小时以内/1小时以上"""
    if s is None or (isinstance(s, float) and pd.isna(s)) or str(s).strip() == '':
        return None
    text = str(s).strip()
    # 提取所有数字
    nums = [int(x) for x in re.findall(r'\d+', text)]
    if not nums:
        return None
    # 判断是否含"小时"
    has_hour = '小时' in text or 'h' in text.lower()
    # 取最大值作为分档依据
    max_val = max(nums)
    # 如果含小时关键字，换算成分钟
    if has_hour and max_val <= 24:
        max_minutes = max_val * 60
    else:
        max_minutes = max_val
    if max_minutes <= 15:
        return '15分钟以内'
    elif max_minutes <= 30:
        return '30分钟'
    elif max_minutes <= 60:
        return '1小时以内'
    else:
        return '1小时以上'


def split_categories(s):
    """分割分类字段"""
    if s is None or (isinstance(s, float) and pd.isna(s)):
        return []
    text = str(s)
    # 按中英文逗号、换行分割
    parts = re.split(r'[，,\r\n]+', text)
    return [p.strip() for p in parts if p.strip()]


def clean_str(v):
    """清洗字符串字段"""
    if v is None or (isinstance(v, float) and pd.isna(v)):
        return None
    s = str(v).strip().replace('\r', '').replace('\n', ' ')
    return s if s else None


# ===== 主处理流程 =====
def read_csv():
    """读取 CSV，自动尝试编码"""
    for enc in ['utf-8', 'gbk', 'gb18030']:
        try:
            df = pd.read_csv(CSV_PATH, encoding=enc)
            print(f"CSV 读取成功，编码: {enc}")
            return df
        except (UnicodeDecodeError, UnicodeError):
            continue
    raise RuntimeError("无法解码 CSV 文件")


def process_data():
    """主处理函数"""
    df = read_csv()
    original_total = len(df)

    # 筛选：status=1 且 title/yl 非空
    df = df[df['status'] == 1].copy()
    df = df[df['title'].notna()]
    df = df[df['yl'].notna()]
    # 进一步 strip 后非空
    df = df[df['title'].apply(lambda x: str(x).strip() != '')]
    df = df[df['yl'].apply(lambda x: str(x).strip() != '')]
    valid_count = len(df)

    # 按 id 升序取前 2000
    df['id'] = df['id'].astype(int)
    df = df.sort_values('id', ascending=True).head(TARGET_ROWS)
    print(f"筛选后取前 {len(df)} 条（有效 {valid_count} 条）")

    return df, original_total, valid_count


def build_db(df):
    """构建 SQLite 数据库"""
    # 幂等：先删旧库
    if os.path.exists(DB_PATH):
        os.remove(DB_PATH)

    conn = sqlite3.connect(DB_PATH)
    conn.execute("PRAGMA journal_mode=WAL;")
    cur = conn.cursor()

    # 建表
    cur.executescript('''
    CREATE TABLE IF NOT EXISTS recipes (
        id          INTEGER PRIMARY KEY,
        did         TEXT,
        title       TEXT NOT NULL,
        thumb       TEXT,
        video_url   TEXT,
        video_platform TEXT,
        description TEXT,
        difficulty  INTEGER,
        difficulty_label TEXT,
        cost_time   TEXT,
        tip         TEXT,
        main_category TEXT,
        grade       REAL,
        cook_count  INTEGER,
        view_count  INTEGER,
        fav_count   INTEGER
    );

    CREATE TABLE IF NOT EXISTS ingredients (
        id   INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        category TEXT
    );

    CREATE TABLE IF NOT EXISTS recipe_ingredients (
        recipe_id     INTEGER NOT NULL,
        ingredient_id INTEGER NOT NULL,
        amount        TEXT,
        sort_order    INTEGER,
        PRIMARY KEY (recipe_id, ingredient_id),
        FOREIGN KEY (recipe_id)     REFERENCES recipes(id),
        FOREIGN KEY (ingredient_id) REFERENCES ingredients(id)
    );

    CREATE TABLE IF NOT EXISTS recipe_categories (
        recipe_id INTEGER NOT NULL,
        category  TEXT    NOT NULL,
        is_main   INTEGER DEFAULT 0,
        PRIMARY KEY (recipe_id, category)
    );

    CREATE TABLE IF NOT EXISTS recipe_steps (
        id         INTEGER PRIMARY KEY AUTOINCREMENT,
        recipe_id  INTEGER NOT NULL,
        step_num   INTEGER NOT NULL,
        step_text  TEXT,
        step_pic   TEXT,
        FOREIGN KEY (recipe_id) REFERENCES recipes(id)
    );
    ''')

    # 统计用
    ingredient_counter = Counter()
    category_counter = Counter()  # (category, is_main) -> count
    platform_counter = Counter()
    thumb_count = 0
    grade_anomaly = 0
    written_count = 0

    # 食材名 -> id 映射
    ingredient_id_map = {}
    # 食材名 -> 分类 映射
    ingredient_category_map = {}

    for _, row in df.iterrows():
        rid = int(row['id'])

        # 主表字段
        title = clean_str(row['title'])
        did = clean_str(row['did'])
        thumb = clean_str(row['thumb'])
        videourl = clean_str(row['videourl'])
        video_platform = detect_platform(row['videourl'])
        desc = clean_str(row['desc'])
        difficulty = int(row['difficulty']) if pd.notna(row['difficulty']) else None
        difficulty_label = DIFFICULTY_MAP.get(difficulty) if difficulty is not None else None
        cost_time = normalize_cost_time(row['costtime'])
        tip = clean_str(row['tip'])
        main_category = clean_str(row['zid'])
        grade = float(row['grade']) if pd.notna(row['grade']) else None
        cook_count = int(row['up']) if pd.notna(row['up']) else None
        view_count = int(row['viewnum']) if pd.notna(row['viewnum']) else None
        fav_count = int(row['favnum']) if pd.notna(row['favnum']) else None

        # 评分异常检测
        if grade is not None and not (0 <= grade <= 5):
            grade_anomaly += 1

        if thumb:
            thumb_count += 1
        if video_platform:
            platform_counter[video_platform] += 1

        # 插入 recipes
        cur.execute('''
            INSERT INTO recipes (id, did, title, thumb, video_url, video_platform,
                                description, difficulty, difficulty_label, cost_time,
                                tip, main_category, grade, cook_count, view_count, fav_count)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
        ''', (rid, did, title, thumb, videourl, video_platform,
              desc, difficulty, difficulty_label, cost_time,
              tip, main_category, grade, cook_count, view_count, fav_count))
        written_count += 1

        # 食材处理
        yl_list = split_hash(row['yl'])
        fl_list = split_hash(row['fl'])
        # 补齐 fl
        if len(fl_list) < len(yl_list):
            fl_list = fl_list + [''] * (len(yl_list) - len(fl_list))

        sort_order = 0
        for ing_name, amount in zip(yl_list, fl_list):
            cleaned = clean_ingredient_name(ing_name)
            if not cleaned:
                continue
            # 插入 ingredients 表（去重），并写入食材分类
            if cleaned not in ingredient_id_map:
                ing_category = classify_ingredient(cleaned)
                cur.execute(
                    'INSERT OR IGNORE INTO ingredients (name, category) VALUES (?, ?)',
                    (cleaned, ing_category),
                )
                cur.execute('SELECT id FROM ingredients WHERE name = ?', (cleaned,))
                ingredient_id_map[cleaned] = cur.fetchone()[0]
                ingredient_category_map[cleaned] = ing_category
            ing_id = ingredient_id_map[cleaned]
            ingredient_counter[cleaned] += 1

            cur.execute('''
                INSERT OR IGNORE INTO recipe_ingredients (recipe_id, ingredient_id, amount, sort_order)
                VALUES (?,?,?,?)
            ''', (rid, ing_id, clean_str(amount) or '', sort_order))
            sort_order += 1

        # 分类处理
        # zid 作为主分类
        if main_category:
            cur.execute('''
                INSERT OR IGNORE INTO recipe_categories (recipe_id, category, is_main)
                VALUES (?,?,1)
            ''', (rid, main_category))
            category_counter[(main_category, 1)] += 1

        # cid 作为子分类
        for cat in split_categories(row['cid']):
            if cat == main_category:
                # 已作为主分类插入
                if (cat, 1) not in category_counter or category_counter[(cat, 1)] == 0:
                    cur.execute('''
                        INSERT OR IGNORE INTO recipe_categories (recipe_id, category, is_main)
                        VALUES (?,?,1)
                    ''', (rid, cat))
                    category_counter[(cat, 1)] += 1
                continue
            cur.execute('''
                INSERT OR IGNORE INTO recipe_categories (recipe_id, category, is_main)
                VALUES (?,?,0)
            ''', (rid, cat))
            category_counter[(cat, 0)] += 1

        # 步骤处理
        steptext_list = split_hash(row['steptext'])
        steppic_list = split_hash(row['steppic'])
        if len(steppic_list) < len(steptext_list):
            steppic_list = steppic_list + [''] * (len(steptext_list) - len(steppic_list))

        for idx, (step_text, step_pic) in enumerate(zip(steptext_list, steppic_list), start=1):
            # 去掉步骤文本前导的 "1. " 序号
            step_text_clean = re.sub(r'^\d+[\.\s、]+', '', step_text).strip()
            step_pic_clean = clean_str(step_pic) if step_pic else None
            cur.execute('''
                INSERT INTO recipe_steps (recipe_id, step_num, step_text, step_pic)
                VALUES (?,?,?,?)
            ''', (rid, idx, step_text_clean or None, step_pic_clean))

    # 创建索引
    cur.executescript('''
    CREATE INDEX IF NOT EXISTS idx_recipes_difficulty ON recipes(difficulty);
    CREATE INDEX IF NOT EXISTS idx_recipes_grade      ON recipes(grade);
    CREATE INDEX IF NOT EXISTS idx_recipes_main_cat   ON recipes(main_category);
    CREATE INDEX IF NOT EXISTS idx_recipe_ing_ing     ON recipe_ingredients(ingredient_id);
    CREATE INDEX IF NOT EXISTS idx_ing_name           ON ingredients(name);
    CREATE INDEX IF NOT EXISTS idx_recipes_cost_time  ON recipes(cost_time);
    CREATE INDEX IF NOT EXISTS idx_recipe_cat_cat     ON recipe_categories(category);
    ''')

    conn.commit()
    conn.close()

    return {
        'written_count': written_count,
        'ingredient_total': len(ingredient_id_map),
        'category_total': len(set(k[0] for k in category_counter.keys())),
        'platform_counter': dict(platform_counter),
        'thumb_count': thumb_count,
        'grade_anomaly': grade_anomaly,
        'ingredient_counter': ingredient_counter,
        'category_counter': category_counter,
        'ingredient_id_map': ingredient_id_map,
        'ingredient_category_map': ingredient_category_map,
    }


def write_json(stats):
    """输出 JSON 文件"""
    # ingredients_list.json：按频次降序，含食材分类
    ing_items = []
    for name, count in stats['ingredient_counter'].most_common():
        ing_items.append({
            'id': stats['ingredient_id_map'][name],
            'name': name,
            'count': count,
            'category': stats['ingredient_category_map'].get(name, '其他'),
        })
    with open(INGREDIENTS_JSON, 'w', encoding='utf-8') as f:
        json.dump(ing_items, f, ensure_ascii=False, indent=2)

    # categories_list.json：按数量降序
    # 合并 is_main 信息（同一分类可能既有 main 又有 sub）
    cat_main_map = {}
    cat_count = Counter()
    for (cat, is_main), cnt in stats['category_counter'].items():
        cat_count[cat] += cnt
        if is_main:
            cat_main_map[cat] = 1
    cat_items = []
    for cat, cnt in cat_count.most_common():
        cat_items.append({
            'category': cat,
            'count': cnt,
            'is_main': cat_main_map.get(cat, 0)
        })
    with open(CATEGORIES_JSON, 'w', encoding='utf-8') as f:
        json.dump(cat_items, f, ensure_ascii=False, indent=2)


def print_report(original_total, valid_count, stats):
    """打印处理报告"""
    print('\n' + '=' * 50)
    print('食谱数据预处理报告')
    print('=' * 50)
    print(f"原始总行数:        {original_total}")
    print(f"有效行数:          {valid_count}")
    print(f"实际写入行数:      {stats['written_count']}")
    print(f"食材去重后总数:    {stats['ingredient_total']}")
    print(f"分类总数:          {stats['category_total']}")
    print(f"有缩略图菜谱数:    {stats['thumb_count']}")
    print(f"评分异常值数量:    {stats['grade_anomaly']}")
    print('\n各视频平台数量统计:')
    if stats['platform_counter']:
        for platform, cnt in sorted(stats['platform_counter'].items(), key=lambda x: -x[1]):
            print(f"  {platform:12s}: {cnt}")
    else:
        print('  (无视频)')
    print('\n输出文件:')
    print(f"  数据库:     {DB_PATH}")
    print(f"  食材JSON:   {INGREDIENTS_JSON}")
    print(f"  分类JSON:   {CATEGORIES_JSON}")
    print('=' * 50)


def main():
    print('开始数据预处理...')
    df, original_total, valid_count = process_data()
    stats = build_db(df)
    write_json(stats)
    print_report(original_total, valid_count, stats)


if __name__ == '__main__':
    main()
